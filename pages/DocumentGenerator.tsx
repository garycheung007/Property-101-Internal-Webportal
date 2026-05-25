
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { FileText, Loader2, Eye, FileType, FileInput, Phone, Mail, AtSign, CalendarClock, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { BodyCorporate, Meeting, User as SystemUser } from '../types';

const getMeetingTypeLabel = (type?: string) => {
    switch(type) {
        case 'AGM': return 'Annual General Meeting';
        case 'EGM': return 'Extraordinary General Meeting';
        case 'SGM': return 'Special General Meeting';
        case 'Committee': return 'Committee Meeting';
        default: return 'General Meeting';
    }
};

const replaceMergeTags = (template: string, data: { complex: BodyCorporate, meeting: Meeting | null, manager: any, systemSettings?: any, isForExport?: boolean }) => {
    const targetDate = data.meeting?.date || data.complex.nextAgmDate;
    const targetTime = data.meeting?.time || data.complex.nextAgmTime;
    const targetVenue = data.meeting?.venue || data.complex.nextAgmVenue;
    const targetType = data.meeting?.type || 'AGM';

    const meetingDay = targetDate ? new Date(targetDate).toLocaleDateString('en-NZ', { weekday: 'long' }) : '[Day]';
    const meetingDateFormatted = targetDate ? new Date(targetDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) : '[Date]';
    const meetingTimeFormatted = targetTime ? new Date(`2000-01-01T${targetTime}`).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : '[Time]';
    
    const noiDueRaw = data.meeting?.noiResponseDueDate || data.complex.noiResponseDueDate;
    const noiDueDate = noiDueRaw ? new Date(noiDueRaw).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) : '[NOI Due Date]';
    const noiDueDay = noiDueRaw ? new Date(noiDueRaw).toLocaleDateString('en-NZ', { weekday: 'long' }) : '[Day]';
    
    const noiDueTime = data.complex.noiResponseDueTime ? new Date(`2000-01-01T${data.complex.noiResponseDueTime}`).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : '4:00 pm';

    const sigHtml = data.manager?.signatureUrl 
        ? `<img src="${data.manager.signatureUrl}" width="200" style="width: 200px; height: auto; display: block; margin-top: 10pt; margin-bottom: 0pt;" />` 
        : `<div style="font-family: 'Brush Script MT', cursive; font-size: 24pt; color: #555; padding-top: 10pt; padding-bottom: 0pt;">${data.manager?.name || 'Manager Signature'}</div>`;

    const deadlineFooter = `
        <div style="border: 1.5pt solid #000; padding: 15pt; text-align: center; font-weight: bold; margin-top: 25pt; font-size: 11pt; color: black; mso-margin-top-alt: 25pt;">
            Please note, notices and nominations must be received no later than<br/>
            <span style="font-size: 14pt;">${noiDueTime} ${noiDueDay} ${noiDueDate}</span>
        </div>
    `;

    const headerImg = data.systemSettings?.headerImageUrl;
    const footerImg = data.systemSettings?.footerImageUrl;

    const headerHtml = headerImg 
        ? `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: none; margin-bottom: 25pt;"><tr><td align="center" style="border: none; padding:0;"><img src="${headerImg}" width="600" style="width: 600px;" /></td></tr></table>`
        : '';
    
    const footerHtml = footerImg
        ? `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: none; margin-top: 30pt;"><tr><td align="center" style="border: none; padding:0;"><img src="${footerImg}" width="600" style="width: 600px;" /></td></tr></table>`
        : '';

    const tags: Record<string, string> = {
        '{{bc_name}}': data.complex.name,
        '{{bc_number}}': data.complex.bcNumber,
        '{{address}}': data.complex.address,
        '{{meeting_type}}': getMeetingTypeLabel(targetType),
        '{{meeting_day}}': meetingDay,
        '{{meeting_date}}': meetingDateFormatted,
        '{{meeting_time}}': meetingTimeFormatted,
        '{{venue}}': targetVenue || '[Venue]',
        '{{noi_due_date}}': noiDueDate,
        '{{noi_due_day}}': noiDueDay,
        '{{noi_due_time}}': noiDueTime,
        '{{manager_name}}': data.manager?.name || 'The Manager',
        '{{manager_title}}': data.manager?.title || 'Body Corporate Manager',
        '{{manager_signature}}': sigHtml,
        '{{current_date}}': new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }),
        '{{deadline_footer}}': deadlineFooter,
        '{{header}}': headerHtml,
        '{{footer}}': footerHtml
    };

    let result = template;
    Object.entries(tags).forEach(([tag, value]) => {
        result = result.split(tag).join(value);
    });
    return result;
};

// Standard Styles for the Word Export and Preview
const getSharedStyles = (fontSize: string = '11pt', spacing: number = 10) => `
    @page Section1 {
        margin: 20mm;
        mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body { 
        font-family: 'Calibri', 'Arial', sans-serif; 
        font-size: ${fontSize}; 
        line-height: 120%; 
        mso-line-height-rule: exactly;
        color: black; 
        margin: 0; 
        padding: 0;
    }
    p, li { 
        margin-top: 0pt; 
        margin-bottom: ${spacing}pt; 
        mso-margin-top-alt: 0pt; 
        mso-margin-bottom-alt: ${spacing}pt;
        mso-add-space: auto;
        font-weight: normal;
        mso-style-next: Normal;
    }
    h1 { font-size: 16pt; font-weight: bold; margin-top: 0pt; margin-bottom: 12pt; mso-margin-bottom-alt: 12pt; text-align: center; }
    h2 { font-size: 14pt; font-weight: bold; margin-top: 0pt; margin-bottom: 10pt; mso-margin-bottom-alt: 10pt; text-align: center; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    th, td { border: 1px solid #000; padding: 6pt; text-align: left; vertical-align: top; font-size: 10pt; }
    strong, b { font-weight: bold; }
    u { text-decoration: underline; }
    .letter-content p:last-child { margin-bottom: 0pt; mso-margin-bottom-alt: 0pt; }
    .page-break { page-break-before: always; mso-break-type: section-break; }
`;

/**
 * Standardizes the editor snippet into a clean native Microsoft Word section break.
 */
const cleanHtmlForWord = (html: string) => {
    return html.replace(/<div class="page-break"[\s\S]*?<\/div>/g, '<br style="page-break-before: always; clear: both; mso-break-type: section-break;">');
};

const generateLetterHtml = (complex: BodyCorporate, meeting: Meeting | null, manager: any, template: string, systemSettings?: any, isForExport: boolean = false) => {
    let content = replaceMergeTags(template, { complex, meeting, manager, systemSettings, isForExport });
    if (isForExport) content = cleanHtmlForWord(content);
    
    const spacing = systemSettings?.paragraphSpacing !== undefined ? systemSettings.paragraphSpacing : 10;
    const headerImg = systemSettings?.headerImageUrl;
    const footerImg = systemSettings?.footerImageUrl;

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8">
        <!--[if gte gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
        <style>${getSharedStyles('11pt', spacing)}</style>
      </head>
      <body>
          <div class="Section1" style="padding: 20mm;">
              <div class="letter-content">${content}</div>
          </div>
      </body></html>
    `;
};

const generateFormHtml = (complex: BodyCorporate, meeting: Meeting | null, template: string, systemSettings?: any, isForExport: boolean = false) => {
    let content = replaceMergeTags(template, { complex, meeting, manager: null, systemSettings, isForExport });
    if (isForExport) content = cleanHtmlForWord(content);

    const spacing = systemSettings?.paragraphSpacing !== undefined ? systemSettings.paragraphSpacing : 10;

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8">
        <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
        <style>${getSharedStyles('10pt', spacing)}</style>
      </head>
      <body>
          <div class="Section1" style="padding: 15mm;">
              <div class="form-content">${content}</div>
          </div>
      </body></html>
    `;
};

const DocumentGenerator: React.FC = () => {
  const { complexes, managers, systemSettings } = useData();
  const [selectedBcId, setSelectedBcId] = useState<string>('');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'letter' | 'form'>('letter');
  
  const selectedComplex = complexes.find(c => c.id === selectedBcId);
  const selectedMeeting = selectedComplex?.meetings.find(m => m.id === selectedMeetingId) || null;
  const assignedManager = selectedComplex ? managers.find(m => m.name === selectedComplex.managerName) : null;
  
  const templates = systemSettings.documentTemplates || { noiLetter: '', responseForm: '' };

  const handleGenerate = () => {
    if (!selectedBcId) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setShowPreview(true); }, 500);
  };

  const downloadDoc = (content: string, filename: string) => {
      const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const exportLetter = () => {
      if (!selectedComplex) return;
      const isISOC = selectedComplex.type === 'Incorporated Society';
      const template = isISOC 
        ? (templates.noiLetterISOC || templates.noiLetter) 
        : (templates.noiLetterBC || templates.noiLetter);
      const content = generateLetterHtml(selectedComplex, selectedMeeting, assignedManager, template, systemSettings, true);
      downloadDoc(content, `Notice_of_Intention_${selectedComplex.bcNumber}.doc`);
  };

  const exportForm = () => {
      if (!selectedComplex) return;
      const isISOC = selectedComplex.type === 'Incorporated Society';
      const template = isISOC 
        ? (templates.responseFormISOC || templates.responseForm) 
        : (templates.responseFormBC || templates.responseForm);
      const content = generateFormHtml(selectedComplex, selectedMeeting, template, systemSettings, true);
      downloadDoc(content, `Response_Form_${selectedComplex.bcNumber}.doc`);
  };

  // High-fidelity preview using iframe to isolate document styles
  const previewHtml = useMemo(() => {
    if (!selectedComplex) return '';
    const isISOC = selectedComplex.type === 'Incorporated Society';
    
    if (previewMode === 'letter') {
        const template = isISOC 
            ? (templates.noiLetterISOC || templates.noiLetter) 
            : (templates.noiLetterBC || templates.noiLetter);
        return generateLetterHtml(selectedComplex, selectedMeeting, assignedManager, template, systemSettings, false);
    } else {
        const template = isISOC 
            ? (templates.responseFormISOC || templates.responseForm) 
            : (templates.responseFormBC || templates.responseForm);
        return generateFormHtml(selectedComplex, selectedMeeting, template, systemSettings, false);
    }
  }, [selectedComplex, selectedMeeting, assignedManager, previewMode, templates, systemSettings]);

  return (
    <div className="h-[calc(100vh-8rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-1 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Meeting Document
                    </h1>
                    <p className="text-slate-500">Create official notices and forms.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-5 transition-colors">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">1. Select Property</label>
                        <select 
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={selectedBcId}
                            onChange={(e) => { setSelectedBcId(e.target.value); setSelectedMeetingId(''); setShowPreview(false); }}
                        >
                            <option value="">-- Choose a Property --</option>
                            {complexes.map(bc => (<option key={bc.id} value={bc.id}>{bc.bcNumber} - {bc.name}</option>))}
                        </select>
                    </div>

                    {selectedComplex && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">2. Select Meeting Session</label>
                            <div className="relative">
                                <CalendarClock className="absolute left-3 top-3 text-slate-400" size={18} />
                                <select 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                    value={selectedMeetingId}
                                    onChange={(e) => { setSelectedMeetingId(e.target.value); setShowPreview(false); }}
                                >
                                    <option value="">-- Select from Calendar --</option>
                                    {(!selectedComplex.meetings || selectedComplex.meetings.length === 0) ? (
                                        <option disabled>No meetings scheduled</option>
                                    ) : (
                                        [...selectedComplex.meetings].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.date ? new Date(m.date).toLocaleDateString('en-NZ') : 'TBC'} - {m.type} ({m.venue})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !selectedBcId || (selectedComplex?.meetings?.length > 0 && !selectedMeetingId)}
                        className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg uppercase tracking-widest text-xs"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Eye size={20} />}
                        <span>Preview Official Notice</span>
                    </button>

                    {showPreview && (
                        <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200 pt-4 border-t dark:border-slate-800">
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button onClick={() => setPreviewMode('letter')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${previewMode === 'letter' ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600' : 'text-slate-50'}`}>Letter</button>
                                <button onClick={() => setPreviewMode('form')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${previewMode === 'form' ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600' : 'text-slate-50'}`}>Form</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={exportLetter} className="w-full bg-[#2b579a] hover:bg-[#1e3f72] text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all shadow-lg text-xs uppercase tracking-tighter"><FileType size={18} /><span>Export Letter</span></button>
                                <button onClick={exportForm} className="w-full bg-[#1e7242] hover:bg-[#155e34] text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all shadow-lg text-xs uppercase tracking-tighter"><FileInput size={18} /><span>Export Form</span></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-2 bg-slate-200 dark:bg-slate-950 rounded-3xl border border-slate-300 dark:border-slate-800 flex flex-col h-full overflow-hidden relative shadow-inner">
                <div className="absolute inset-0 overflow-y-auto p-8 flex justify-center custom-scrollbar">
                    {showPreview && selectedComplex ? (
                        <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="origin-top scale-[0.85] shadow-2xl transition-transform">
                                <iframe 
                                    title="Document Preview"
                                    srcDoc={previewHtml}
                                    className="w-[210mm] h-[297mm] border-none bg-white"
                                    style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 h-full p-12 text-center">
                            <FileText size={64} className="mb-6 opacity-10 text-blue-600" />
                            <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-sm mb-2">Generation Workbench</h3>
                            <p className="max-w-xs text-xs italic">Select a property and a scheduled calendar session to generate official correspondence.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default DocumentGenerator;
