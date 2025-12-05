
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { analyzeComplianceStatus } from '../services/geminiService';
import { FileText, Sparkles, Loader2, Eye, FileType, FileInput, Phone, Mail, AtSign } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BodyCorporate } from '../types';

const DocumentGenerator: React.FC = () => {
  const { complexes, managers } = useData();
  const [selectedBcId, setSelectedBcId] = useState<string>('');
  const [docType, setDocType] = useState<'AGM_NOTICE' | 'STATUS_REPORT'>('AGM_NOTICE');
  
  // Generation State
  const [loading, setLoading] = useState(false);
  const [reportContent, setReportContent] = useState<string>(''); // For AI Report
  const [showPreview, setShowPreview] = useState(false); // For AGM Template
  
  // Get selected BC data
  const selectedComplex = complexes.find(c => c.id === selectedBcId);
  const assignedManager = selectedComplex ? managers.find(m => m.name === selectedComplex.managerName) : null;

  const handleGenerate = async () => {
    if (!selectedBcId) return;

    if (docType === 'AGM_NOTICE') {
        // Show the template
        setShowPreview(true);
    } else {
        // For Status Report, use Gemini
        setLoading(true);
        setShowPreview(false);
        try {
            const result = await analyzeComplianceStatus(selectedComplex!);
            setReportContent(result);
        } catch (err) {
            console.error(err);
            setReportContent("Error generating report. Please check API configuration.");
        } finally {
            setLoading(false);
        }
    }
  };

  const downloadDoc = (content: string, filename: string) => {
      const blob = new Blob(['\ufeff', content], {
          type: 'application/msword'
      });
      
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
      const content = generateLetterHtml(selectedComplex, assignedManager);
      downloadDoc(content, `Notice_of_Intention_${selectedComplex.bcNumber}.doc`);
  };

  const exportForm = () => {
      if (!selectedComplex) return;
      const content = generateFormHtml(selectedComplex);
      downloadDoc(content, `Response_Form_${selectedComplex.bcNumber}.doc`);
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Controls Panel */}
            <div className="lg:col-span-1 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Document Generator
                    </h1>
                    <p className="text-slate-500">Create official notices and reports.</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Property</label>
                        <select 
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                            value={selectedBcId}
                            onChange={(e) => { setSelectedBcId(e.target.value); setShowPreview(false); setReportContent(''); }}
                        >
                            <option value="">-- Choose a Property --</option>
                            {complexes.map(bc => (
                                <option key={bc.id} value={bc.id}>{bc.bcNumber} - {bc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => { setDocType('AGM_NOTICE'); setShowPreview(false); setReportContent(''); }}
                                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                                    docType === 'AGM_NOTICE' 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                General Meeting Notice of Intention
                            </button>
                            <button 
                                onClick={() => { setDocType('STATUS_REPORT'); setShowPreview(false); setReportContent(''); }}
                                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                                    docType === 'STATUS_REPORT' 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                AI Risk Report
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !selectedBcId}
                        className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (docType === 'AGM_NOTICE' ? <Eye size={20} /> : <Sparkles size={20} />)}
                        <span>{docType === 'AGM_NOTICE' ? 'Preview Document' : 'Generate Analysis'}</span>
                    </button>

                    {showPreview && docType === 'AGM_NOTICE' && (
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={exportLetter}
                                className="w-full bg-[#2b579a] hover:bg-[#1e3f72] text-white py-3 rounded-lg font-medium flex flex-col items-center justify-center gap-1 transition-all shadow-lg text-sm"
                            >
                                <FileType size={18} />
                                <span>Download Letter</span>
                            </button>
                             <button 
                                onClick={exportForm}
                                className="w-full bg-[#1e7242] hover:bg-[#155e34] text-white py-3 rounded-lg font-medium flex flex-col items-center justify-center gap-1 transition-all shadow-lg text-sm"
                            >
                                <FileInput size={18} />
                                <span>Download Form</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Visual Preview Panel */}
            <div className="lg:col-span-2 bg-slate-100 rounded-xl border border-slate-200 flex flex-col h-full overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto p-8 flex justify-center">
                    {docType === 'AGM_NOTICE' ? (
                        showPreview && selectedComplex ? (
                            <div className="flex flex-col gap-8 origin-top scale-[0.85]">
                                <AgmContent complex={selectedComplex} manager={assignedManager} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                                <FileText size={48} className="mb-4 opacity-50" />
                                <p>Select a property and click Preview Document.</p>
                            </div>
                        )
                    ) : (
                        reportContent ? (
                            <div className="bg-white p-8 rounded-lg shadow-sm w-full max-w-3xl prose prose-slate">
                                <ReactMarkdown>{reportContent}</ReactMarkdown>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                                <Sparkles size={48} className="mb-4 opacity-50" />
                                <p>Click Generate Analysis to create an AI report.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

// --- Helper Functions & Components ---

const AgmContent: React.FC<{ complex: BodyCorporate, manager: any }> = ({ complex, manager }) => {
    const meetingDay = complex.nextAgmDate 
      ? new Date(complex.nextAgmDate).toLocaleDateString('en-NZ', { weekday: 'long' }) 
      : '[Day]';
    const meetingDate = complex.nextAgmDate 
      ? new Date(complex.nextAgmDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) 
      : '[Date]';
    const meetingTime = complex.nextAgmTime 
      ? new Date(`2000-01-01T${complex.nextAgmTime}`).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
      : '[Time]';
      
    const noiDueDate = complex.noiResponseDueDate 
      ? new Date(complex.noiResponseDueDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
      : '[NOI Due Date]';
    const noiDueTime = complex.noiResponseDueTime 
      ? new Date(`2000-01-01T${complex.noiResponseDueTime}`).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
      : '4:00 pm';

    // New Header Component with Purple Bar
    const Header = () => (
        <div className="flex justify-between items-start mb-8 h-20">
            <div className="flex h-full">
                {/* Purple Bar */}
                <div className="w-[18px] h-full bg-[#C02685] mr-4"></div>
                
                {/* Contact Info */}
                <div className="flex flex-col justify-center text-[#5A5A5A] text-[10pt]">
                    <div className="flex items-center gap-2 mb-0.5">
                        <Phone size={14} className="text-[#C02685]" fill="currentColor" />
                        <span>+64 9 523 3161</span>
                    </div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <AtSign size={14} className="text-[#C02685]" />
                        <span>info@prop101.co.nz</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Mail size={14} className="text-[#C02685]" />
                        <span>PO Box 11355, Ellerslie, Auckland 1542</span>
                    </div>
                </div>
            </div>

            {/* Logo */}
            <div className="flex flex-col items-end justify-center h-full">
                <div className="text-right font-bold text-3xl text-[#5A5A5A] tracking-tight flex items-center gap-1 font-[Calibri]">
                    property <span className="text-white bg-[#C02685] px-1 pb-1 rounded-sm leading-none flex items-center h-8">101</span>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* PAGE 1: NOTICE */}
            <div className="shadow-xl bg-white min-h-[297mm] w-[210mm] p-[20mm] text-black text-[11pt] leading-relaxed" style={{ fontFamily: 'Calibri, sans-serif' }}>
                <Header />

                <div className="mb-6">
                    <p>{new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>

                <div className="mb-6">
                    <p>The Proprietors</p>
                    <p>Body Corporate {complex.bcNumber}</p>
                    <p className="whitespace-pre-line">{complex.address}</p>
                </div>

                <p className="mb-6">Dear Owners</p>

                <p className="font-bold mb-2">Body Corporate {complex.bcNumber} - {complex.name}</p>
                <p className="font-bold mb-6">Notice of Intention to call the Annual General Meeting {meetingDay}, {meetingDate} at {meetingTime}</p>

                <p className="mb-6 text-justify">
                    We are pleased to confirm that your Annual General Meeting has been scheduled for <span className="font-bold">{meetingDay}, {meetingDate} at {meetingTime}</span>. 
                    The meeting will be held in-person at <span className="font-bold">{complex.nextAgmVenue || '[Venue]'}, {complex.nextAgmVenueAddress || '[Venue Address]'}</span>, 
                    although remote access will be available via Zoom on request in advance.
                </p>

                <p className="font-bold mb-2">Chairperson Election:</p>
                <p className="mb-4 text-justify">
                    In accordance with the Unit Titles Act you are entitled to provide nominations for the chairperson. A candidate for election as a chairperson must be nominated by another unit owner in the unit title development and must be the owner of a principal unit or a director nominated by the candidate in accordance with Regulation 3 of the Unit Titles Regulations 2011 to act as chairperson on the candidate’s behalf.
                </p>
                <p className="mb-6 text-justify">
                    A chairperson candidate must consent to the nomination and at the time nominations are required by Regulations to be received (being {noiDueDate} at {noiDueTime}), a nominee must have no overdue body corporate levies or other amounts payable and owing to the body corporate.
                </p>
                <p className="mb-6 text-justify">
                    The Act automatically confers membership of the chairperson to the body corporate committee and (unless decided by ordinary resolution at a general meeting), the chairperson of the body corporate shall be the chairperson of the body corporate committee.
                </p>

                <p className="font-bold mb-2">Committee Election:</p>
                <p className="mb-6 text-justify">
                    In addition, you are entitled to provide nominations for the committee. A candidate for election as a committee member must be the owner of a principal unit in the unit title development or a person nominated by the candidate in accordance with Regulation 24(4) of the Unit Titles Regulations 2011 to act as a committee member on the candidate’s behalf. At the time nominations are required by Regulations to be received (being {noiDueDate} at {noiDueTime}), a nominee must have no overdue body corporate levies or other amounts payable and owing to the body corporate. A nominated candidate may nominate themself or be nominated by another unit owner in the unit title development and must consent to the nomination.
                </p>

                <p className="font-bold mb-2">Matters for discussion:</p>
                <p className="mb-4 text-justify">
                    In addition, you are invited to propose matters for discussion at the meeting that you wish to have considered at the Annual General Meeting.
                </p>
                <p className="mb-6 text-justify">
                    Please note any owner who is in arrears with body corporate levies or other amounts payable and owing to the Body Corporate is ineligible to vote unless paid in full prior to the meeting.
                </p>
                
                <p className="mb-4 text-justify">
                    Please complete and return the attached <span className="font-bold">AGM Response Form</span> to the Body Corporate Managers <span className="font-bold">Body Corporate {complex.bcNumber}</span>, by email <a href="mailto:info@prop101.co.nz" className="text-[#C02685] underline">info@prop101.co.nz</a> no later than {noiDueDate} at {noiDueTime}.
                </p>
                <p className="mb-4 text-justify">
                    In due course a full agenda will be distributed, together with the Zoom registration link, the financial statements, a draft budget, and related correspondence.
                </p>
                <p className="mb-4">
                    If you have any queries, please do not hesitate to contact us.
                </p>
                <p className="mb-8">
                    We look forward to meeting you.
                </p>
                <p className="mb-8">Yours sincerely</p>

                {manager ? (
                    <div className="mt-8">
                        {/* Signature */}
                        {manager.signatureUrl ? (
                            <img src={manager.signatureUrl} alt="Signature" className="h-16 object-contain mb-2" />
                        ) : (
                            <div className="h-12 w-32 mb-2 font-serif text-3xl text-slate-600 italic leading-none transform -rotate-3 origin-left opacity-80">
                                {manager.name.split(' ')[0]}
                            </div>
                        )}
                        <p className="font-bold text-[#00AEEF]">{manager.name}</p>
                        {manager.qualifications && <p className="text-xs">{manager.qualifications}</p>}
                        {manager.title && <p className="text-sm">{manager.title}</p>}
                        <p className="font-bold">Property 101 Group Limited</p>
                        <p>Mobile: {manager.phone}</p>
                        <p>Email: <a href={`mailto:${manager.email}`} className="text-[#00AEEF] underline">{manager.email}</a></p>
                    </div>
                ) : (
                    <div className="text-red-500 font-bold">[Manager not assigned]</div>
                )}
            </div>

            {/* PAGE 2: RESPONSE FORM */}
            <div className="shadow-xl bg-white min-h-[297mm] w-[210mm] p-[20mm] text-black text-[11pt] leading-relaxed relative" style={{ fontFamily: 'Calibri, sans-serif' }}>
                <Header />
                
                <div className="mt-8">
                    <p className="font-bold">To: Body Corporate {complex.bcNumber} - {complex.name}<br/>
                    c/- Property 101 Group Limited<br/>
                    PO Box 11355, Ellerslie<br/>
                    AUCKLAND 1542</p>

                    <p className="font-bold mt-6">Annual General Meeting {meetingDay}, {meetingDate} at {meetingTime}</p>

                    <p className="font-bold mt-6 underline">Nominations for Officers:</p>

                    <p>1. I nominate the following owner for Body Corporate <span className="font-bold">Chairperson</span> (with their prior consent):</p>

                    <div className="border border-black mt-2">
                        <div className="flex bg-gray-100 font-bold border-b border-black">
                            <div className="w-[70%] p-2 border-r border-black">Name:</div>
                            <div className="w-[30%] p-2">Unit Number:</div>
                        </div>
                        <div className="h-12"></div>
                    </div>

                    <p className="mt-4 flex items-center gap-2">
                         I confirm that I have contacted the above person who has accepted the nomination and I am not nominating myself or someone on my unit title
                         <span className="border border-black w-4 h-4 inline-block"></span>
                    </p>

                    <p className="italic text-[9pt] mt-2">
                        (Please note if an above nominee is successfully appointed Body Corporate Chairperson they will automatically be on the Committee. They will also be the Committee Chair unless the Body Corporate resolves otherwise. However, to ensure your nominee is on the Committee (should their Chairperson nomination not be successful) please also insert them as a Committee nominee below)
                    </p>

                    <p className="mt-6">2. I nominate the following owner(s) for the <span className="font-bold">Committee</span> (with their prior consent):</p>

                    <div className="border border-black mt-2">
                        <div className="flex bg-gray-100 font-bold border-b border-black">
                            <div className="w-[70%] p-2 border-r border-black">Name:</div>
                            <div className="w-[30%] p-2">Unit Number:</div>
                        </div>
                        <div className="h-8 border-b border-black"></div>
                        <div className="h-8 border-b border-black"></div>
                        <div className="h-8 border-b border-black"></div>
                        <div className="h-8"></div>
                    </div>

                    <p className="mt-4 flex items-center gap-2">
                         I confirm that I have contacted the above person/s who has/have accepted the nomination
                         <span className="border border-black w-4 h-4 inline-block"></span>
                    </p>
                    
                    <p className="italic text-[9pt] mt-2">
                        (Please ensure that where a Committee nominee above is an employee of a unit owner company they have obtained director authorisation. Please state both the name of the employee and the unit owner company above.)
                    </p>

                    <p className="mt-4 text-[10pt]">
                        I acknowledge that if a nominee has unpaid levies or other amounts owing to the Body Corporate at the day/time nominations close, their nomination cannot be accepted.
                    </p>

                    <p className="font-bold mt-6 underline">Matters for discussion:</p>
                    <div className="border-b border-black h-8 mt-2"></div>
                    <div className="border-b border-black h-8 mt-2"></div>

                    <div className="mt-12 space-y-4">
                        <p><span className="font-bold">Signed:</span> ___________________________________________________________________</p>
                        <p><span className="font-bold">Name:</span> ____________________________________________________________________</p>
                        <p><span className="font-bold">Unit Number:</span> ______________________________________________________________</p>
                    </div>

                    <div className="mt-8 text-center bg-gray-50 p-4 border border-gray-200">
                        <p>Please note, notices and nominations must be received no later than</p>
                        <p className="font-bold text-lg">{noiDueTime} {noiDueDate}</p>
                        <p className="font-bold mt-2">Please return to email: <a href="mailto:info@prop101.co.nz" className="text-[#C02685]">info@prop101.co.nz</a></p>
                    </div>
                </div>
            </div>
        </>
    )
};


// Function to generate the HTML String for the Word Doc
const getCommonStyles = () => `
    body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; }
    p { margin-bottom: 12pt; }
    .bold { font-weight: bold; }
    .header-text { font-size: 10pt; color: #5A5A5A; }
    .pink-text { color: #C02685; }
    .blue-text { color: #00AEEF; }
    .logo-text { font-size: 24pt; font-weight: bold; color: #5A5A5A; }
    .logo-box { background-color: #C02685; color: white; padding: 0 4px; margin-left: 2px; }
    table.form-table { border-collapse: collapse; width: 100%; }
    table.form-table td { border: 1px solid #000; padding: 5px; }
`;

const getHeaderHtml = () => `
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <!-- Purple Bar -->
            <td width="15" style="background-color: #C02685;"></td>
            <td width="15"></td> <!-- Spacer -->
            
            <!-- Contact Details -->
            <td valign="middle" align="left" style="font-family: 'Calibri', sans-serif; font-size: 10pt; color: #5A5A5A;">
                <p style="margin: 0; margin-bottom: 2pt;">
                    <span style="color: #C02685; font-weight: bold; font-family: sans-serif;">&#9742;</span>&nbsp;+64 9 523 3161
                </p>
                <p style="margin: 0; margin-bottom: 2pt;">
                    <span style="color: #C02685; font-weight: bold; font-family: sans-serif;">@</span>&nbsp;info@prop101.co.nz
                </p>
                <p style="margin: 0;">
                    <span style="color: #C02685; font-weight: bold; font-family: sans-serif;">&#9993;</span>&nbsp;PO Box 11355, Ellerslie, Auckland 1542
                </p>
            </td>
            
            <!-- Logo -->
            <td valign="middle" align="right">
                 <p class="logo-text" style="margin:0; font-family: 'Calibri', sans-serif;">property<span style="background:#C02685; color:white; padding:0 4px; font-size: 24pt;">101</span></p>
            </td>
        </tr>
    </table>
`;

const generateLetterHtml = (complex: BodyCorporate, manager: any) => {
    const meetingDay = complex.nextAgmDate 
      ? new Date(complex.nextAgmDate).toLocaleDateString('en-NZ', { weekday: 'long' }) 
      : '[Day]';
    const meetingDate = complex.nextAgmDate 
      ? new Date(complex.nextAgmDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) 
      : '[Date]';
    const meetingTime = complex.nextAgmTime 
      ? new Date(`2000-01-01T${complex.nextAgmTime}`).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
      : '[Time]';
      
    const noiDueDate = complex.noiResponseDueDate 
      ? new Date(complex.noiResponseDueDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
      : '[NOI Due Date]';
    const noiDueTime = complex.noiResponseDueTime 
      ? new Date(`2000-01-01T${complex.noiResponseDueTime}`).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
      : '4:00 pm';

    const signatureBlock = manager?.signatureUrl 
        ? `<img src="${manager.signatureUrl}" height="60" style="height: 60px;" alt="Signature" />`
        : `<p style="font-family: 'Times New Roman', serif; font-size: 24pt; font-style: italic; color: #555;">${manager?.name?.split(' ')[0] || ''}</p>`;

    const managerBlock = manager ? `
        <br/><br/>
        ${signatureBlock}
        <p style="margin: 0; font-weight: bold; color: #00AEEF;">${manager.name}</p>
        ${manager.qualifications ? `<p style="margin: 0; font-size: 9pt;">${manager.qualifications}</p>` : ''}
        ${manager.title ? `<p style="margin: 0; font-size: 10pt;">${manager.title}</p>` : ''}
        <p style="margin: 0; font-weight: bold;">Property 101 Group Limited</p>
        <p style="margin: 0;">Mobile: ${manager.phone || ''}</p>
        <p style="margin: 0;">Email: <a href="mailto:${manager.email}" style="color: #00AEEF; text-decoration: underline;">${manager.email}</a></p>
    ` : '<p style="color: red;">[Manager not assigned]</p>';

    return `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="utf-8">
            <title>Notice of Intention - ${complex.bcNumber}</title>
            <style>${getCommonStyles()}</style>
        </head>
        <body>
            ${getHeaderHtml()}
            <br/><br/>
            <p>${new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <br/>
            <p style="margin:0;">The Proprietors</p>
            <p style="margin:0;">Body Corporate ${complex.bcNumber}</p>
            <p style="margin:0;">${complex.address.replace(/\n/g, '<br/>')}</p>
            <br/><br/>
            <p>Dear Owners</p>
            <p class="bold">Body Corporate ${complex.bcNumber} - ${complex.name}</p>
            <p class="bold">Notice of Intention to call the Annual General Meeting ${meetingDay}, ${meetingDate} at ${meetingTime}</p>
            <p>We are pleased to confirm that your Annual General Meeting has been scheduled for <span class="bold">${meetingDay}, ${meetingDate} at ${meetingTime}</span>. The meeting will be held in-person at <span class="bold">${complex.nextAgmVenue || '[Venue]'}, ${complex.nextAgmVenueAddress || '[Venue Address]'}</span>, although remote access will be available via Zoom on request in advance.</p>
            <p class="bold" style="margin-bottom:0;">Chairperson Election:</p>
            <p>In accordance with the Unit Titles Act you are entitled to provide nominations for the chairperson. A candidate for election as a chairperson must be nominated by another unit owner in the unit title development and must be the owner of a principal unit or a director nominated by the candidate in accordance with Regulation 3 of the Unit Titles Regulations 2011 to act as chairperson on the candidate’s behalf.</p>
            <p>A chairperson candidate must consent to the nomination and at the time nominations are required by Regulations to be received (being ${noiDueDate} at ${noiDueTime}), a nominee must have no overdue body corporate levies or other amounts payable and owing to the body corporate.</p>
            <p>The Act automatically confers membership of the chairperson to the body corporate committee and (unless decided by ordinary resolution at a general meeting), the chairperson of the body corporate shall be the chairperson of the body corporate committee.</p>
            <p class="bold" style="margin-bottom:0;">Committee Election:</p>
            <p>In addition, you are entitled to provide nominations for the committee. A candidate for election as a committee member must be the owner of a principal unit in the unit title development or a person nominated by the candidate in accordance with Regulation 24(4) of the Unit Titles Regulations 2011 to act as a committee member on the candidate’s behalf. At the time nominations are required by Regulations to be received (being ${noiDueDate} at ${noiDueTime}), a nominee must have no overdue body corporate levies or other amounts payable and owing to the body corporate. A nominated candidate may nominate themself or be nominated by another unit owner in the unit title development and must consent to the nomination.</p>
            <p class="bold" style="margin-bottom:0;">Matters for discussion:</p>
            <p>In addition, you are invited to propose matters for discussion at the meeting that you wish to have considered at the Annual General Meeting.</p>
            <p>Please note any owner who is in arrears with body corporate levies or other amounts payable and owing to the Body Corporate is ineligible to vote unless paid in full prior to the meeting.</p>
            <p>Please complete and return the attached <span class="bold">AGM Response Form</span> to the Body Corporate Managers <span class="bold">Body Corporate ${complex.bcNumber}</span>, by email <a href="mailto:info@prop101.co.nz" style="color:#C02685;">info@prop101.co.nz</a> no later than ${noiDueDate} at ${noiDueTime}.</p>
            <p>In due course a full agenda will be distributed, together with the Zoom registration link, the financial statements, a draft budget, and related correspondence.</p>
            <p>If you have any queries, please do not hesitate to contact us.</p>
            <p>We look forward to meeting you.</p>
            <p>Yours sincerely</p>
            ${managerBlock}
        </body>
        </html>
    `;
};

const generateFormHtml = (complex: BodyCorporate) => {
    const meetingDay = complex.nextAgmDate 
      ? new Date(complex.nextAgmDate).toLocaleDateString('en-NZ', { weekday: 'long' }) 
      : '[Day]';
    const meetingDate = complex.nextAgmDate 
      ? new Date(complex.nextAgmDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) 
      : '[Date]';
    const meetingTime = complex.nextAgmTime 
      ? new Date(`2000-01-01T${complex.nextAgmTime}`).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
      : '[Time]';
      
    const noiDueDate = complex.noiResponseDueDate 
      ? new Date(complex.noiResponseDueDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
      : '[NOI Due Date]';
    const noiDueTime = complex.noiResponseDueTime 
      ? new Date(`2000-01-01T${complex.noiResponseDueTime}`).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
      : '4:00 pm';

    return `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="utf-8">
            <title>Response Form - ${complex.bcNumber}</title>
            <style>${getCommonStyles()}</style>
        </head>
        <body>
            ${getHeaderHtml()}
            <br/><br/>
            <p style="font-weight:bold;">To: Body Corporate ${complex.bcNumber} - ${complex.name}<br/>
            c/- Property 101 Group Limited<br/>
            PO Box 11355, Ellerslie<br/>
            AUCKLAND 1542</p>
            <p class="bold">Annual General Meeting ${meetingDay} ${meetingDate} at ${meetingTime}</p>
            <p class="bold" style="text-decoration: underline;">Nominations for Officers:</p>
            <p>1. I nominate the following owner for Body Corporate <span class="bold">Chairperson</span> (with their prior consent):</p>
            <table class="form-table">
                <tr>
                    <td width="70%" style="background-color: #f2f2f2; font-weight: bold;">Name:</td>
                    <td width="30%" style="background-color: #f2f2f2; font-weight: bold;">Unit Number:</td>
                </tr>
                 <tr>
                    <td height="30"></td>
                    <td></td>
                </tr>
            </table>
            <p>I confirm that I have contacted the above person who has accepted the nomination and I am not nominating myself or someone on my unit title <span style="font-size: 14pt;">&#9744;</span></p>
            <p style="font-style: italic; font-size: 9pt;">(Please note if an above nominee is successfully appointed Body Corporate Chairperson they will automatically be on the Committee. They will also be the Committee Chair unless the Body Corporate resolves otherwise. However, to ensure your nominee is on the Committee (should their Chairperson nomination not be successful) please also insert them as a Committee nominee below)</p>
            <p>2. I nominate the following owner(s) for the <span class="bold">Committee</span> (with their prior consent):</p>
            <table class="form-table">
                <tr>
                    <td width="70%" style="background-color: #f2f2f2; font-weight: bold;">Name:</td>
                    <td width="30%" style="background-color: #f2f2f2; font-weight: bold;">Unit Number:</td>
                </tr>
                 <tr>
                    <td height="25"></td>
                    <td></td>
                </tr>
                <tr>
                    <td height="25"></td>
                    <td></td>
                </tr>
                <tr>
                    <td height="25"></td>
                    <td></td>
                </tr>
                 <tr>
                    <td height="25"></td>
                    <td></td>
                </tr>
            </table>
            <p>I confirm that I have contacted the above person/s who has/have accepted the nomination <span style="font-size: 14pt;">&#9744;</span></p>
            <p style="font-style: italic; font-size: 9pt;">(Please ensure that where a Committee nominee above is an employee of a unit owner company they have obtained director authorisation. Please state both the name of the employee and the unit owner company above.)</p>
            <p>I acknowledge that if a nominee has unpaid levies or other amounts owing to the Body Corporate at the day/time nominations close, their nomination cannot be accepted.</p>
            <p class="bold" style="text-decoration: underline;">Matters for discussion:</p>
            <p style="border-bottom: 1px solid #000; height: 20px;">&nbsp;</p>
            <p style="border-bottom: 1px solid #000; height: 20px;">&nbsp;</p>
            <br/>
            <p><span class="bold">Signed:</span> __________________________________________________________________________</p>
            <p><span class="bold">Name:</span> __________________________________________________________________________</p>
            <p><span class="bold">Unit Number:</span> _____________________________________________________________________</p>
            <div style="text-align: center; margin-top: 30px;">
                <p>Please note, notices and nominations must be received no later than<br/>
                <span class="bold">${noiDueTime} ${noiDueDate}</span></p>
                <p class="bold">Please return to email: <a href="mailto:info@prop101.co.nz" style="color:#C02685;">info@prop101.co.nz</a></p>
            </div>
        </body>
        </html>
    `;
};

export default DocumentGenerator;
