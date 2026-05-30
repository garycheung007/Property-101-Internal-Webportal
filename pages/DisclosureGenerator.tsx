
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { FileSignature, Download, Loader2, FileText, ShieldCheck, Edit3 } from 'lucide-react';
import { BodyCorporate, Contractor, User as SystemUser } from '../types';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_MAP: Record<string, number> = {
    jan:0,january:0,feb:1,february:1,mar:2,march:2,apr:3,april:3,
    may:4,jun:5,june:5,jul:6,july:6,aug:7,august:7,
    sep:8,september:8,oct:9,october:9,nov:10,november:10,dec:11,december:11,
};

function parseDayMonth(str: string): { day: number; month: number } | null {
    const match = str.trim().match(/^(\d{1,2})[\s\-\/]([a-zA-Z]+)$/);
    if (!match) return null;
    const month = MONTH_MAP[match[2].toLowerCase()];
    if (month === undefined) return null;
    return { day: parseInt(match[1]), month };
}

function deriveFyDates(startStr: string, endStr: string): { fyStart: string; fyEnd: string; lastFinancialStatement: string } {
    const start = parseDayMonth(startStr);
    const end = parseDayMonth(endStr);
    if (!start || !end) return { fyStart: startStr, fyEnd: endStr, lastFinancialStatement: '[Balance Date]' };
    const today = new Date();
    const currentYear = today.getFullYear();
    const fyStartThisYear = new Date(currentYear, start.month, start.day);
    const fyStartYear = today >= fyStartThisYear ? currentYear : currentYear - 1;
    const fyEndYear = fyStartYear + 1;
    const fyStartDate = new Date(fyStartYear, start.month, start.day);
    const lastStmtDate = new Date(fyStartDate.getTime() - 86400000);
    return {
        fyStart: `${start.day} ${MONTH_NAMES[start.month]} ${fyStartYear}`,
        fyEnd: `${end.day} ${MONTH_NAMES[end.month]} ${fyEndYear}`,
        lastFinancialStatement: `${lastStmtDate.getDate()} ${MONTH_NAMES[lastStmtDate.getMonth()]} ${lastStmtDate.getFullYear()}`,
    };
}

function deriveLtmpNextRenewal(lastRenewalDateStr: string): string {
    if (!lastRenewalDateStr) return '[Date]';
    const d = new Date(lastRenewalDateStr);
    if (isNaN(d.getTime())) return '[Date]';
    d.setFullYear(d.getFullYear() + 3);
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

const DisclosureGenerator: React.FC = () => {
  const { complexes, contractors, managers, systemSettings } = useData();
  
  const [selectedBcId, setSelectedBcId] = useState<string>('');
  const [complexSearch, setComplexSearch] = useState('');
  const [showComplexDropdown, setShowComplexDropdown] = useState(false);
  const [docType, setDocType] = useState<'s146' | 's147' | 'cpl'>('s146');
  const [unitNumber, setUnitNumber] = useState<string>('');
  const [unitLevy, setUnitLevy] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerAddress, setOwnerAddress] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const selectedComplex = complexes.find(c => c.id === selectedBcId);
  const filteredComplexes = complexSearch
    ? complexes.filter(c => c.name.toLowerCase().includes(complexSearch.toLowerCase()) || c.bcNumber.toLowerCase().includes(complexSearch.toLowerCase()))
    : complexes;
  const broker = contractors.find(c => c.name === selectedComplex?.insuranceBroker);
  const manager = managers.find(m => m.name === selectedComplex?.managerName);

  // Reset per-transaction fields when complex changes
  useEffect(() => {
    setUnitNumber('');
    setUnitLevy('');
    setOwnerName('');
    setOwnerAddress('');
  }, [selectedBcId]);

  // Handle data mapping for the high-fidelity template
  const replaceMergeTags = (template: string) => {
    if (!selectedComplex) return template;
    
    const todayStr = new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });
    const hasRemediation = selectedComplex.weathertightnessClaimMade || 
                           selectedComplex.weathertightnessRemediatedWithoutClaim || 
                           selectedComplex.weathertightnessNotRemediated ||
                           selectedComplex.remedialWorkDone;

    const remediationText = hasRemediation 
        ? `You will need to arrange for the statement to be signed before providing it to any interested parties. Therefore, please ensure the document is checked for accuracy prior to signing. Especially with regard to item (1)(a) & disclosing information on the levies & remedial project as per updates provided to owners by the Body Corporate.`
        : `You will need to arrange for the statement to be signed before providing it to any interested parties. Therefore, please ensure the document is checked for accuracy prior to signing.`;

    const getInsuranceNoting = (brk?: Contractor) => {
        if (!brk) return "TBC";
        if (brk.notingRequirements?.length) {
            return `${brk.name} (${brk.notingRequirements.map(r => r.detail).join(', ')})`;
        }
        return `${brk.name} (${brk.email || 'info@prop101.co.nz'})`;
    };

    const sigHtml = manager?.signatureUrl 
        ? `<img src="${manager.signatureUrl}" width="200" style="width: 200px; height: auto; display: block; margin-top: 10pt;" />` 
        : `<div style="font-family: 'Brush Script MT', cursive; font-size: 24pt; color: #555; padding-top: 10pt;">${manager?.name || 'Manager Signature'}</div>`;

    /**
     * Helper to build "Yes - [Details]" or "No" string based on statutory fields
     */
    const formatStatutory = (isYes?: boolean, details?: string) => {
        if (!isYes) return 'No';
        return details ? `Yes - ${details}` : 'Yes';
    };

    const fyDates = deriveFyDates(selectedComplex.financialYearStart || '1 April', selectedComplex.financialYearEnd || '31 March');

    const tags: Record<string, string> = {
        '{{bc_name}}': selectedComplex.name,
        '{{bc_number}}': selectedComplex.bcNumber,
        '{{address}}': selectedComplex.address,
        '{{current_date}}': todayStr,
        '{{unit_number}}': unitNumber || '[Unit]',
        '{{unit_levy}}': unitLevy || '[Levy Amount]',
        '{{owner_name}}': ownerName || '[Owner Name]',
        '{{owners_address}}': ownerAddress || '[Owner Address]',
        '{{fy_start}}': fyDates.fyStart,
        '{{fy_end}}': fyDates.fyEnd,
        '{{insurance_noting}}': getInsuranceNoting(broker),
        '{{insurance_underwriter}}': selectedComplex.insuranceUnderwriter || 'TBC',
        '{{insurance_expiry}}': selectedComplex.insuranceExpiry || 'TBC',
        '{{remediation_text}}': remediationText,
        '{{manager_name}}': manager?.name || selectedComplex.managerName,
        '{{manager_title}}': manager?.title || 'Body Corporate Manager',
        '{{manager_email}}': manager?.email || '',
        '{{manager_signature}}': sigHtml,
        '{{weathertightness_claim}}': formatStatutory(selectedComplex.weathertightnessClaimMade, selectedComplex.weathertightnessClaimDetails),
        '{{weathertightness_remediated}}': formatStatutory(selectedComplex.weathertightnessRemediatedWithoutClaim, selectedComplex.weathertightnessRemediatedDetails),
        '{{weathertightness_not_remediated}}': formatStatutory(selectedComplex.weathertightnessNotRemediated, selectedComplex.weathertightnessNotRemediatedDetails),
        '{{earthquake_prone}}': formatStatutory(selectedComplex.earthquakeProneIssues, selectedComplex.earthquakeProneDetails),
        '{{any_other_significant_defects}}': formatStatutory(selectedComplex.anyOtherSignificantDefects, selectedComplex.anyOtherSignificantDefectsDetails),
        '{{proceedings_in_court}}': formatStatutory(selectedComplex.involvedInProceedings, selectedComplex.proceedingsInCourt),
        '{{last_financial_statement}}': fyDates.lastFinancialStatement,
        '{{operating_fund_balance}}': selectedComplex.operatingFundBalance || '[Amount]',
        '{{reserve_fund_balance}}': selectedComplex.reserveFundBalance || '[Amount]',
        '{{ltmp_last_renewal}}': selectedComplex.ltmpLastRenewalDate ? new Date(selectedComplex.ltmpLastRenewalDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) : '[Date]',
        '{{ltmp_next_renewal}}': deriveLtmpNextRenewal(selectedComplex.ltmpLastRenewalDate || ''),
        '{{ltmp_prepared_by}}': selectedComplex.ltmpCompletedBy || '',
        '{{water_rate}}': selectedComplex.waterRateDescription || '[Rate Details]',
        '{{water_rate_provider}}': contractors.find(c => c.id === selectedComplex.waterRateContractorId)?.name || '',
        '{{gst_text}}': selectedComplex.isGstRegistered ? 'inclusive of GST' : ''
    };

    let result = template;
    Object.entries(tags).forEach(([tag, value]) => {
        result = result.split(tag).join(value);
    });

    // Case-insensitive regex pass — catches tag casing mismatches in older stored templates
    const regexReplace = (tag: string, value: string) => {
        result = result.replace(new RegExp(`\\{\\{${tag}\\}\\}`, 'gi'), value);
    };
    regexReplace('remediation_text', remediationText);
    regexReplace('weathertightness_claim', formatStatutory(selectedComplex.weathertightnessClaimMade, selectedComplex.weathertightnessClaimDetails));
    regexReplace('weathertightness_remediated', formatStatutory(selectedComplex.weathertightnessRemediatedWithoutClaim, selectedComplex.weathertightnessRemediatedDetails));
    regexReplace('weathertightness_not_remediated', formatStatutory(selectedComplex.weathertightnessNotRemediated, selectedComplex.weathertightnessNotRemediatedDetails));
    regexReplace('earthquake_prone', formatStatutory(selectedComplex.earthquakeProneIssues, selectedComplex.earthquakeProneDetails));
    regexReplace('any_other_significant_defects', formatStatutory(selectedComplex.anyOtherSignificantDefects, selectedComplex.anyOtherSignificantDefectsDetails));
    regexReplace('proceedings_in_court', formatStatutory(selectedComplex.involvedInProceedings, selectedComplex.proceedingsInCourt));

    // Legacy fallback: replace hardcoded literals present in older stored templates
    result = result.split('{{header}}').join('');
    const managerEmail = manager?.email || '';
    const managerTitle = manager?.title || 'Body Corporate Manager';
    result = result.split('<br/>Director<br/>').join(`<br/>${managerTitle}<br/>`);
    result = result.split('Email: info@prop101.co.nz<br/>Ph: 09 523 3161').join(`Email: ${managerEmail}`);
    result = result.split(', Phone: +64 9 523 3161').join('');
    result = result.split(', Phone: 09 523 3161').join('');
    result = result.split('Email: info@prop101.co.nz').join(`Email: ${managerEmail}`);

    return result;
  };

  const getWordStyles = (spacing: number = 10) => `
    @page Section1 { 
        margin: 35mm 20mm 20mm 20mm; 
        mso-header-margin: 20pt;
        mso-footer-margin: 36pt;
        mso-paper-source: 0;
        mso-header: h1;
        mso-footer: f1;
    }
    div.Section1 { page: Section1; }
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 120%; color: black; margin: 0; }
    p, li { margin-top: 0pt; margin-bottom: ${spacing}pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: ${spacing}pt; mso-add-space: auto; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { vertical-align: top; padding: 4pt; border: 1px solid #000; font-size: 10pt; }
    .page-break { page-break-before: always; mso-break-type: section-break; }
  `;

  /**
   * Standardizes the editor snippet into a clean native Microsoft Word section break.
   */
  const cleanHtmlForWord = (html: string) => {
    return html.replace(/<div class="page-break"[\s\S]*?<\/div>/g, '<br style="page-break-before: always; clear: both; mso-break-type: section-break;">');
  };

  const generateFullHtml = (content: string, isForExport: boolean = false) => {
    const spacing = systemSettings?.paragraphSpacing !== undefined ? systemSettings.paragraphSpacing : 10;
    const headerImg = systemSettings?.headerImageUrl;
    const footerImg = systemSettings?.footerImageUrl;

    // 1. Preview Branding: Visible only in the workbench browser preview.
    // We completely omit these when isForExport is true to prevent leakage to Word's body flow.
    const previewHeader = (!isForExport && headerImg) 
        ? `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: none; margin-bottom: 25pt;"><tr><td align="center" style="border: none; padding:0;"><img src="${headerImg}" width="600" style="width: 600px;" /></td></tr></table>` 
        : ``;

    const previewFooter = (!isForExport && footerImg) 
        ? `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: none; margin-top: 30pt;"><tr><td align="center" style="border: none; padding:0;"><img src="${footerImg}" width="600" style="width: 600px;" /></td></tr></table>` 
        : ``;

    // 2. Word Header/Footer Sources: Hidden in browser (display:none), used by Word for the header object.
    const wordHeaderSource = (isForExport && headerImg)
        ? `<div style="mso-element: header; display: none;" id="h1">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: none;"><tr><td align="center" style="border: none; padding:0;"><img src="${headerImg}" width="600" style="width: 600px;" /></td></tr></table>
           </div>`
        : ``;

    const wordFooterSource = (isForExport && footerImg)
        ? `<div style="mso-element: footer; display: none;" id="f1">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: none;"><tr><td align="center" style="border: none; padding:0;"><img src="${footerImg}" width="600" style="width: 600px;" /></td></tr></table>
           </div>`
        : ``;

    let processedContent = content;
    if (isForExport) processedContent = cleanHtmlForWord(processedContent);

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8">
        <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
        <style>${getWordStyles(spacing)}</style>
      </head>
      <body>
          <div class="Section1" style="padding: 20mm;">
              ${previewHeader}
              <div class="main-content">${processedContent}</div>
              ${previewFooter}
          </div>
          ${wordHeaderSource}
          ${wordFooterSource}
      </body></html>
    `;
  };

  const handleGenerate = () => {
    if (!selectedBcId) { alert("Please select a property first."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setShowPreview(true); }, 600);
  };

  const previewHtml = useMemo(() => {
    if (!selectedComplex) return '';
    const template = systemSettings.documentTemplates?.[docType] || '';
    const content = replaceMergeTags(template);
    return generateFullHtml(content, false);
  }, [selectedComplex, docType, unitNumber, unitLevy, ownerName, ownerAddress, systemSettings]);

  const downloadDoc = () => {
    const template = systemSettings.documentTemplates?.[docType] || '';
    const content = replaceMergeTags(template);
    const finalHtml = generateFullHtml(content, true);
    
    const blob = new Blob(['\ufeff', finalHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docType.toUpperCase()}_Unit_${unitNumber || 'TBC'}_${selectedComplex?.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileSignature className="text-pink-600" /> Disclosure Workbench
          </h1>
          <p className="text-slate-500">Statutory S146, S147 and CPL generation engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border dark:border-slate-800 space-y-6">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">1. Document Type</label>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { id: 's146', label: 'PCDS (S146)', color: 'pink' },
                            { id: 's147', label: 'Pre-Settlement (S147)', color: 'blue' },
                            { id: 'cpl', label: 'PL Certificate (CPL)', color: 'emerald' }
                        ].map(type => (
                            <button 
                                key={type.id} 
                                onClick={() => { setDocType(type.id as any); setShowPreview(false); }}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${docType === type.id ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/10' : 'border-transparent bg-slate-50 dark:bg-slate-800/50 text-slate-500'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${docType === type.id ? 'bg-pink-600' : 'bg-slate-300'}`}></div>
                                <span className="text-sm font-bold">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">2. Property Selection</label>
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full rounded-xl border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                            placeholder="Type to search complex..."
                            value={complexSearch}
                            onChange={e => { setComplexSearch(e.target.value); setSelectedBcId(''); setShowPreview(false); setShowComplexDropdown(true); }}
                            onFocus={() => setShowComplexDropdown(true)}
                            onBlur={() => setTimeout(() => setShowComplexDropdown(false), 150)}
                        />
                        {selectedBcId && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">✓</span>}
                        {showComplexDropdown && filteredComplexes.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                                {filteredComplexes.map(bc => (
                                    <button
                                        key={bc.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-pink-50 dark:hover:bg-pink-900/20 dark:text-white border-b dark:border-slate-700 last:border-0"
                                        onMouseDown={() => { setSelectedBcId(bc.id); setComplexSearch(`${bc.bcNumber} - ${bc.name}`); setShowComplexDropdown(false); setShowPreview(false); }}
                                    >
                                        <span className="font-bold text-pink-600 mr-1">{bc.bcNumber}</span>{bc.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t dark:border-slate-800">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Edit3 size={14} className="text-pink-600" /> 3. Unit Info
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Unit / PU</label><input type="text" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm" placeholder="e.g. 5A" value={unitNumber} onChange={e => setUnitNumber(e.target.value)}/></div>
                        <div><label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Annual Levy ($)</label><input type="text" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm" placeholder="e.g. 4500" value={unitLevy} onChange={e => setUnitLevy(e.target.value)}/></div>
                    </div>
                    <div><label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Current Owner(s)</label><input type="text" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm" placeholder="e.g. John Doe" value={ownerName} onChange={e => setOwnerName(e.target.value)}/></div>
                    <div><label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Owner's Address</label><textarea rows={2} className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm resize-none" placeholder="e.g. 12 Example St, Auckland 1010" value={ownerAddress} onChange={e => setOwnerAddress(e.target.value)}/></div>
                </div>

                <button onClick={handleGenerate} disabled={loading || !selectedBcId} className="w-full bg-slate-900 dark:bg-pink-700 hover:opacity-90 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg uppercase tracking-widest text-xs">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                    <span>Assemble Disclosure</span>
                </button>
            </div>
        </div>

        <div className="lg:col-span-3 bg-slate-200 dark:bg-slate-950 rounded-3xl border border-slate-300 dark:border-slate-800 min-h-[700px] flex flex-col overflow-hidden shadow-inner">
            {showPreview ? (
                <div className="flex flex-col h-full">
                    <div className="p-4 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Previewing Package:</span>
                                <span className="text-sm font-bold text-pink-600 uppercase tracking-widest">{docType.toUpperCase()}</span>
                            </div>
                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={downloadDoc} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all uppercase"><Download size={16} /> Export to Word</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar flex justify-center bg-slate-300 dark:bg-slate-900">
                        <div className="origin-top scale-[0.85] shadow-2xl transition-transform">
                            <iframe title="Disclosure Preview" srcDoc={previewHtml} className="w-[210mm] min-h-[1200mm] border-none bg-white shadow-2xl" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6"><FileText size={40} className="opacity-10 text-pink-600" /></div>
                    <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Preview Engine Ready</h3>
                    <p className="max-w-xs mt-2 text-sm italic">Assemble the statutory pack by filling the unit details in the sidebar. Branding will repeat on every page of the export.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DisclosureGenerator;
