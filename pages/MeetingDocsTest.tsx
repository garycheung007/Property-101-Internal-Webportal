
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import { FlaskConical, Download, Loader2, Eye, X } from 'lucide-react';
import { db } from '../firebase';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { BodyCorporate, Meeting, TemplateFileRecord } from '../types';
import { DEFAULT_CONFLICT_REGISTER_TEMPLATE } from '../constants/defaultTemplates';

type TemplateKey = 'noiCoverLetter' | 'responseForm' | 'debtCollectionFlowchart' | 'noticeOfDelegation' | 'noiCoverLetterIsoc' | 'responseFormIsoc' | 'debtCollectionFlowchartIsoc';

const LABELS: Record<TemplateKey, string> = {
  noiCoverLetter: 'NOI Cover Letter',
  responseForm: 'Response Form',
  debtCollectionFlowchart: 'Debt Collection Flowchart',
  noticeOfDelegation: 'Notice of Delegation',
  noiCoverLetterIsoc: 'NOI Cover Letter',
  responseFormIsoc: 'Response Form',
  debtCollectionFlowchartIsoc: 'Debt Collection Flowchart',
};

const BC_KEYS: TemplateKey[] = ['noiCoverLetter', 'responseForm', 'debtCollectionFlowchart', 'noticeOfDelegation'];
const IS_KEYS: TemplateKey[] = ['noiCoverLetterIsoc', 'responseFormIsoc', 'debtCollectionFlowchartIsoc'];

const DOC_LABELS: Record<TemplateKey, string> = {
  noiCoverLetter: 'Notice of Intention Cover Letter',
  responseForm: 'Response Form',
  debtCollectionFlowchart: 'Debt Collection Flowchart',
  noticeOfDelegation: 'Notice of Delegation',
  noiCoverLetterIsoc: 'Notice of Intention Cover Letter',
  responseFormIsoc: 'Response Form',
  debtCollectionFlowchartIsoc: 'Debt Collection Flowchart',
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
    Manager_Name: manager?.name || complex.managerName || '',
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

const buildIframeSrcDoc = (html: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page{margin:0;size:A4}
    html{background:#525659;padding:20px;}
    body{background:white;width:210mm;margin:0 auto;padding:25mm 20mm;box-shadow:0 2px 16px rgba(0,0,0,0.5);box-sizing:border-box;position:relative;min-height:297mm;}
    .pg-sep{position:absolute;left:0;right:0;height:20px;background:#525659;z-index:10;}
    *{font-family:Calibri,Arial,sans-serif;box-sizing:border-box;}
    a{color:inherit!important;text-decoration:none!important;}
    p{margin:0.3em 0;}
    table{border-collapse:collapse;width:100%;}
    td,th{vertical-align:top;padding:2px 8px;}
    img{max-width:100%;}
    @media print{html{background:white;padding:0;}body{width:100%;margin:0;padding:25mm 20mm;box-shadow:none;}.pg-sep{display:none;}}
  </style></head><body>${html}<script>(function(){
    var PX=297*(96/25.4);
    function run(){
      var b=document.body;
      var n=Math.ceil(b.scrollHeight/PX);
      b.style.minHeight=(n*297)+'mm';
      document.querySelectorAll('.pg-sep').forEach(function(e){e.remove();});
      for(var i=1;i<n;i++){
        var d=document.createElement('div');
        d.className='pg-sep';
        d.style.top=(i*PX-10)+'px';
        b.appendChild(d);
      }
    }
    window.addEventListener('load',function(){setTimeout(run,300);});
  })();</script></body></html>`;

const MeetingDocsTest: React.FC = () => {
  const { complexes, managers, systemSettings } = useData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [templates, setTemplates] = useState<Partial<Record<TemplateKey, TemplateFileRecord>>>({});
  const [selectedBcId, setSelectedBcId] = useState('');
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewKey, setPreviewKey] = useState<TemplateKey | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const keys: TemplateKey[] = ['noiCoverLetter', 'responseForm', 'debtCollectionFlowchart', 'noticeOfDelegation', 'noiCoverLetterIsoc', 'responseFormIsoc', 'debtCollectionFlowchartIsoc'];
    Promise.all(keys.map(k => getDoc(doc(db, 'templates_v2', k)))).then(snaps => {
      const loaded: Partial<Record<TemplateKey, TemplateFileRecord>> = {};
      snaps.forEach((snap, i) => { if (snap.exists()) loaded[keys[i]] = snap.data() as TemplateFileRecord; });
      setTemplates(loaded);
    });
  }, []);

  const filteredComplexes = complexes.filter(c => !c.isArchived && (
    !searchQuery ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.bcNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const selectedComplex = complexes.find(c => c.id === selectedBcId);
  const selectedMeeting = selectedComplex?.meetings.find(m => m.id === selectedMeetingId) || null;
  const assignedManager = selectedComplex ? managers.find(m => m.name === selectedComplex.managerName) : undefined;
  const isIsoc = selectedComplex?.type === 'Incorporated Society';
  const activeKeys: TemplateKey[] = (isIsoc ? IS_KEYS : BC_KEYS).filter(
    k => isAdmin || (k !== 'debtCollectionFlowchart' && k !== 'debtCollectionFlowchartIsoc')
  );

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
      // Mammoth may split {{Tag}} across multiple HTML elements; strip any HTML tags inside delimiters before replacing
      html = html.replace(/\{\{[\s\S]*?\}\}/g, m => '{{' + m.slice(2, -2).replace(/<[^>]*>/g, '') + '}}');
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
        nullGetter: () => '',
      });
      docTpl.render({ ...buildMergeData(selectedComplex, selectedMeeting, assignedManager), Manager_Signature: sigUrl });
      const out = docTpl.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(out as Blob);
      const meetingType = selectedMeeting?.type || 'AGM';
      const meetingDate = selectedMeeting?.date
        ? new Date(selectedMeeting.date + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';
      const docLabel = DOC_LABELS[key];
      const datePart = meetingDate ? ` - ${meetingType} ${meetingDate}` : '';
      const prefix = isIsoc ? 'IS' : 'BC';
      a.download = `${prefix} ${selectedComplex.bcNumber} ${selectedComplex.name}${datePart} ${docLabel}.docx`;
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
      `<style>@page{margin:20mm;size:A4}body{font-family:Calibri,Arial,sans-serif;font-size:11pt;padding:0;line-height:1.4}a{color:inherit!important;text-decoration:none!important}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{vertical-align:top;padding:2px 8px}</style>` +
      `</head><body>${previewHtml}</body></html>`
    );
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const buildConflictRegisterHtml = () => {
    if (!selectedComplex) return '';
    const template = systemSettings.conflictRegisterTemplate || DEFAULT_CONFLICT_REGISTER_TEMPLATE;
    const entries = selectedComplex.conflictRegister || [];
    const rows = entries.length > 0
      ? entries.map(e => `<tr>
          <td style="border:1px solid #000;padding:5pt;vertical-align:top;">${e.memberName}</td>
          <td style="border:1px solid #000;padding:5pt;vertical-align:top;">${e.matter}</td>
          <td style="border:1px solid #000;padding:5pt;vertical-align:top;">${e.conflictNature}</td>
          <td style="border:1px solid #000;padding:5pt;vertical-align:top;">${e.dateDisclosed ? new Date(e.dateDisclosed).toLocaleDateString('en-NZ') : ''}</td>
          <td style="border:1px solid #000;padding:5pt;vertical-align:top;text-align:center;">${e.breachOccurred}</td>
          <td style="border:1px solid #000;padding:5pt;vertical-align:top;">${e.breachOccurred === 'YES' && e.breachNotifiedDate ? new Date(e.breachNotifiedDate).toLocaleDateString('en-NZ') : ''}</td>
        </tr>`).join('')
      : `<tr><td colspan="6" style="border:1px solid #000;padding:5pt;text-align:center;color:#666;font-style:italic;">No entries recorded.</td></tr>`;
    return template
      .replace(/\{\{BC_NAME\}\}/g, selectedComplex.name || '')
      .replace(/\{\{BC_NUMBER\}\}/g, selectedComplex.bcNumber || '')
      .replace(/\{\{GENERATED_DATE\}\}/g, new Date().toLocaleDateString('en-NZ'))
      .replace(/\{\{CONFLICT_REGISTER_ROWS\}\}/g, rows);
  };

  const downloadConflictRegisterWord = () => {
    const html = buildConflictRegisterHtml();
    const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Conflict Register - ${selectedComplex?.name}</title><style>body{font-family:Arial,sans-serif;margin:40px;}table{border-collapse:collapse;width:100%;}@page{size:A4 landscape;margin:20mm;}</style></head><body>${html}</body></html>`;
    const blob = new Blob(['﻿', wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Conflict-Register-${selectedComplex?.name || selectedComplex?.bcNumber}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadConflictRegisterPdf = () => {
    const html = buildConflictRegisterHtml();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><title>Conflict Register - ${selectedComplex?.name}</title><style>body{font-family:Arial,sans-serif;margin:40px;}@page{size:A4 landscape;margin:20mm;}@media print{body{margin:0;}}</style></head><body>${html}</body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
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
            <p className="text-slate-500 text-sm mt-1">Select a property and generate merged Word documents.</p>
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
              <div ref={searchRef} className="relative">
                <input
                  type="text"
                  placeholder="Search by name or BC number..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 pr-8 text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    if (!e.target.value) {
                      setSelectedBcId('');
                      setSelectedMeetingId('');
                      setPreviewHtml('');
                      setPreviewKey(null);
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {searchQuery && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => { setSearchQuery(''); setSelectedBcId(''); setSelectedMeetingId(''); setPreviewHtml(''); setPreviewKey(null); setShowSuggestions(false); }}
                  >
                    <X size={14} />
                  </button>
                )}
                {showSuggestions && filteredComplexes.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                    {filteredComplexes.map(bc => (
                      <li
                        key={bc.id}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-pink-50 dark:hover:bg-slate-700 ${bc.id === selectedBcId ? 'bg-pink-50 dark:bg-slate-700 font-semibold text-pink-600' : 'text-slate-700 dark:text-slate-200'}`}
                        onMouseDown={() => {
                          setSelectedBcId(bc.id);
                          setSearchQuery(`${bc.bcNumber} — ${bc.name}`);
                          setShowSuggestions(false);
                          setSelectedMeetingId('');
                          setPreviewHtml('');
                          setPreviewKey(null);
                        }}
                      >
                        <span className="font-mono text-[10px] text-slate-400 mr-1.5">{bc.bcNumber}</span>
                        {bc.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
                <p className="text-[10px] font-semibold text-pink-500 uppercase tracking-widest">
                  {isIsoc ? 'Incorporated Society' : 'Body Corporate'} Templates
                </p>
                {activeKeys.map(renderActionButtons)}
                <div className="pt-3 border-t dark:border-slate-700 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conflict Register</p>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadConflictRegisterWord}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <Download size={12} /> Word
                    </button>
                    <button
                      onClick={downloadConflictRegisterPdf}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <Download size={12} /> PDF
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">PDF opens a print dialog — select "Save as PDF".</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — preview */}
        <div className="lg:col-span-2 bg-slate-200 dark:bg-slate-950 rounded-3xl border border-slate-300 dark:border-slate-800 flex flex-col h-full overflow-hidden relative shadow-inner">
          <div className="absolute inset-0 overflow-hidden">
            {previewHtml ? (
              <iframe
                className="w-full h-full border-0"
                srcDoc={buildIframeSrcDoc(previewHtml)}
                title="Document Preview"
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
