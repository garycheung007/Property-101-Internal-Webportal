
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import { FlaskConical, Upload, Download, Loader2, CheckCircle, Eye } from 'lucide-react';
import { db } from '../firebase';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { BodyCorporate, Meeting, TemplateFileRecord } from '../types';

type TemplateKey = 'noiCoverLetter' | 'responseForm';

const LABELS: Record<TemplateKey, string> = {
  noiCoverLetter: 'NOI Cover Letter',
  responseForm: 'Response Form',
};

const buildMergeData = (complex: BodyCorporate, meeting: Meeting | null, manager?: { name?: string; title?: string }) => {
  const targetDate = meeting?.date || complex.nextAgmDate || '';
  const targetTime = meeting?.time || complex.nextAgmTime || '';
  const targetVenue = meeting?.venue || complex.nextAgmVenue || '';
  const nomRaw = meeting?.noiResponseDueDate || complex.noiResponseDueDate || '';

  const fmtDate = (d: string) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const fmtDay = (d: string) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('en-NZ', { weekday: 'long' }) : '';
  const fmtTime = (t: string) =>
    t ? new Date(`2000-01-01T${t}`).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : '';

  return {
    BC_Number: complex.bcNumber,
    BC_Name: complex.name,
    BC_Address: complex.address,
    Meeting_Day: fmtDay(targetDate),
    Meeting_Date: fmtDate(targetDate),
    Meeting_Time: fmtTime(targetTime),
    Meeting_Venue: targetVenue,
    Nomination_Due_Day: fmtDay(nomRaw),
    Nomination_Due_Date: fmtDate(nomRaw),
    Nomination_Due_Time: complex.noiResponseDueTime ? fmtTime(complex.noiResponseDueTime) : '4:00 pm',
    Current_Date: new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }),
    Manager_Name: manager?.name || '',
    Manager_Title: manager?.title || 'Body Corporate Manager',
  };
};

const toArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

const dataUrlToBuffer = (dataUrl: string): ArrayBuffer => {
  const base64 = dataUrl.split(',')[1];
  return toArrayBuffer(base64);
};

const MeetingDocsTest: React.FC = () => {
  const { complexes, managers } = useData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [templates, setTemplates] = useState<Partial<Record<TemplateKey, TemplateFileRecord>>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [uploading, setUploading] = useState<TemplateKey | null>(null);
  const [selectedBcId, setSelectedBcId] = useState('');
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewKey, setPreviewKey] = useState<TemplateKey | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const noiRef = useRef<HTMLInputElement>(null);
  const rfRef = useRef<HTMLInputElement>(null);
  const inputRefs: Record<TemplateKey, React.RefObject<HTMLInputElement>> = {
    noiCoverLetter: noiRef,
    responseForm: rfRef,
  };

  useEffect(() => {
    Promise.all([
      getDoc(doc(db, 'templates_v2', 'noiCoverLetter')),
      getDoc(doc(db, 'templates_v2', 'responseForm')),
    ]).then(([noiSnap, rfSnap]) => {
      const loaded: Partial<Record<TemplateKey, TemplateFileRecord>> = {};
      if (noiSnap.exists()) loaded.noiCoverLetter = noiSnap.data() as TemplateFileRecord;
      if (rfSnap.exists()) loaded.responseForm = rfSnap.data() as TemplateFileRecord;
      setTemplates(loaded);
      setLoadingTemplates(false);
    }).catch(() => setLoadingTemplates(false));
  }, []);

  const handleUpload = (key: TemplateKey, file: File) => {
    setUploading(key);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const record: TemplateFileRecord = { name: file.name, data: base64, uploadedAt: new Date().toISOString() };
      await setDoc(doc(db, 'templates_v2', key), record);
      setTemplates(prev => ({ ...prev, [key]: record }));
      setUploading(null);
    };
    reader.readAsDataURL(file);
  };

  const selectedComplex = complexes.find(c => c.id === selectedBcId);
  const selectedMeeting = selectedComplex?.meetings.find(m => m.id === selectedMeetingId) || null;
  const assignedManager = selectedComplex ? managers.find(m => m.name === selectedComplex.managerName) : undefined;

  const handlePreview = async (key: TemplateKey) => {
    const tpl = templates[key];
    if (!tpl || !selectedComplex) return;
    setPreviewing(true);
    setPreviewKey(key);
    try {
      const mammoth = await import('mammoth');
      const buffer = toArrayBuffer(tpl.data);
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
      const data = buildMergeData(selectedComplex, selectedMeeting, assignedManager);
      let html = result.value;
      const sigHtml = assignedManager?.signatureUrl
        ? `<img src="${assignedManager.signatureUrl}" style="width:200px;height:auto;display:block;margin:8px 0;" />`
        : '';
      html = html.split('{{%Manager_Signature}}').join(sigHtml);
      html = html.split('{{Manager_Signature}}').join(sigHtml);
      Object.entries(data).forEach(([k, v]) => { html = html.split(`{{${k}}}`).join(v); });
      setPreviewHtml(html);
    } catch {
      alert('Preview failed. Ensure the uploaded file is a valid .docx.');
    }
    setPreviewing(false);
  };

  const handleDownloadDocx = (key: TemplateKey) => {
    const tpl = templates[key];
    if (!tpl || !selectedComplex) return;
    try {
      const sigUrl = assignedManager?.signatureUrl || '';
      const imageModule = new ImageModule({
        centered: false,
        fileType: 'docx',
        getImage: (tagValue: string) => {
          if (tagValue && tagValue.startsWith('data:')) return dataUrlToBuffer(tagValue);
          return new Uint8Array(0).buffer;
        },
        getSize: () => [200, 70],
      });
      const zip = new PizZip(toArrayBuffer(tpl.data));
      const docTpl = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule],
        delimiters: { start: '{{', end: '}}' },
      });
      docTpl.render({ ...buildMergeData(selectedComplex, selectedMeeting, assignedManager), Manager_Signature: sigUrl });
      const out = docTpl.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(out as Blob);
      a.download = `${key === 'noiCoverLetter' ? 'NOI_Cover_Letter' : 'Response_Form'}_${selectedComplex.bcNumber}.docx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert('Word export failed. Make sure the template uses {{Tag}} placeholders (not «Tag»).');
    }
  };

  const handleDownloadPdf = (key: TemplateKey) => {
    if (!previewHtml || previewKey !== key) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8">` +
      `<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;padding:20mm;line-height:1.4}img{max-width:100%}@media print{body{padding:0}}</style>` +
      `</head><body>${previewHtml}</body></html>`
    );
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const renderTemplateCard = (key: TemplateKey) => {
    const tpl = templates[key];
    return (
      <div key={key} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{LABELS[key]}</p>
            {tpl ? (
              <>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{tpl.name}</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Uploaded {new Date(tpl.uploadedAt).toLocaleDateString('en-NZ')}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400 italic mt-1">No template uploaded</p>
            )}
          </div>
          {isAdmin && (
            <>
              <input
                ref={inputRefs[key]}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleUpload(key, e.target.files[0]); e.target.value = ''; }}
              />
              <button
                onClick={() => inputRefs[key].current?.click()}
                disabled={uploading === key}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {uploading === key ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {tpl ? 'Replace' : 'Upload'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderActionButtons = (key: TemplateKey) => (
    <div key={key} className="space-y-1.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{LABELS[key]}</p>
      <div className="flex gap-2">
        <button
          onClick={() => handlePreview(key)}
          disabled={previewing || !templates[key]}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-40"
        >
          {previewing && previewKey === key ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
          Preview
        </button>
        <button
          onClick={() => handleDownloadDocx(key)}
          disabled={!templates[key]}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#2b579a] hover:bg-[#1e3f72] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-40"
        >
          <Download size={12} /> Word
        </button>
        <button
          onClick={() => handleDownloadPdf(key)}
          disabled={!previewHtml || previewKey !== key}
          title="Click Preview first to enable PDF"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-40"
        >
          <Download size={12} /> PDF
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

        {/* Left panel */}
        <div className="lg:col-span-1 space-y-5 overflow-y-auto pr-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FlaskConical className="text-pink-600" size={24} />
              Meeting Docs
              <span className="text-xs font-semibold text-pink-500 bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800 px-2 py-0.5 rounded-full">
                Test
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Upload your Word templates, then generate merged documents.</p>
          </div>

          {/* Template cards */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Word Templates (.docx)</p>
            {loadingTemplates
              ? <div className="flex items-center gap-2 text-slate-400 text-sm py-2"><Loader2 size={14} className="animate-spin" />Loading...</div>
              : ((['noiCoverLetter', 'responseForm'] as TemplateKey[]).map(renderTemplateCard))
            }
            {isAdmin && (
              <p className="text-[10px] text-slate-400 italic px-1 leading-relaxed">
                Templates must use {'{{BC_Number}}'} style placeholders. See the merge field guide below.
              </p>
            )}
          </div>

          {/* Merge field reference */}
          {isAdmin && (
            <details className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <summary className="px-4 py-3 font-bold text-slate-500 cursor-pointer select-none uppercase tracking-widest text-[10px]">
                Merge Field Reference
              </summary>
              <div className="px-4 pb-3 space-y-0.5 text-slate-600 dark:text-slate-400 font-mono">
                {[
                  '{{BC_Number}}', '{{BC_Name}}', '{{BC_Address}}',
                  '{{Meeting_Day}}', '{{Meeting_Date}}', '{{Meeting_Time}}', '{{Meeting_Venue}}',
                  '{{Nomination_Due_Day}}', '{{Nomination_Due_Date}}', '{{Nomination_Due_Time}}',
                  '{{Current_Date}}',
                  '{{Manager_Name}}', '{{Manager_Title}}', '{{%Manager_Signature}}',
                ].map(tag => <p key={tag}>{tag}</p>)}
              </div>
            </details>
          )}

          {/* Generate section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generate</p>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Select Property</label>
              <select
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
                value={selectedBcId}
                onChange={e => { setSelectedBcId(e.target.value); setSelectedMeetingId(''); setPreviewHtml(''); setPreviewKey(null); }}
              >
                <option value="">-- Choose a Property --</option>
                {complexes.filter(c => !c.isArchived).map(bc => (
                  <option key={bc.id} value={bc.id}>{bc.bcNumber} — {bc.name}</option>
                ))}
              </select>
            </div>

            {selectedComplex && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Select Meeting (optional)</label>
                <select
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
                  value={selectedMeetingId}
                  onChange={e => { setSelectedMeetingId(e.target.value); setPreviewHtml(''); setPreviewKey(null); }}
                >
                  <option value="">-- No specific meeting --</option>
                  {[...(selectedComplex.meetings || [])]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('en-NZ') : 'TBC'} — {m.type}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {selectedBcId && (
              <div className="space-y-3 pt-2 border-t dark:border-slate-700">
                {(['noiCoverLetter', 'responseForm'] as TemplateKey[]).map(renderActionButtons)}
                <p className="text-[10px] text-slate-400 italic">PDF opens a print dialog — select "Save as PDF".</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — preview */}
        <div className="lg:col-span-2 bg-slate-200 dark:bg-slate-950 rounded-3xl border border-slate-300 dark:border-slate-800 flex flex-col h-full overflow-hidden relative shadow-inner">
          <div className="absolute inset-0 overflow-y-auto p-8 flex justify-center custom-scrollbar">
            {previewHtml ? (
              <div
                className="w-full max-w-[210mm] bg-white dark:bg-slate-900 shadow-2xl rounded-sm p-[20mm] text-sm leading-relaxed animate-in fade-in duration-300"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 h-full p-12 text-center">
                <FlaskConical size={64} className="mb-6 opacity-10 text-pink-600" />
                <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-sm mb-2">
                  Template Preview
                </h3>
                <p className="max-w-xs text-xs italic">
                  Upload a Word template, select a property, then click Preview to see the merged document.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MeetingDocsTest;
