
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import { FileSignature, Download, Loader2, FileText, Edit3, Eye, AlertTriangle, DollarSign, CheckCircle2 } from 'lucide-react';
import { db } from '../firebase';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Contractor, TemplateFileRecord } from '../types';

// Minimal 1×1 transparent GIF used as fallback when no signature is available
const TRANSPARENT_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const formatNZD = (val: string | undefined, placeholder = '[Amount]'): string => {
  if (!val) return placeholder;
  const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return val;
  return `$${num.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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

function deriveFyDates(startStr: string, endStr: string) {
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
        for(var i=1;i<n;i++){var d=document.createElement('div');d.className='pg-sep';d.style.top=(i*PX-10)+'px';b.appendChild(d);}
    }
    window.addEventListener('load',function(){setTimeout(run,300);});
    })();</script></body></html>`;

const DisclosureGenerator: React.FC = () => {
  const { complexes, contractors, managers, invoices, addInvoice, pricingTiers } = useData();
  const { user } = useAuth();

  const [selectedBcId, setSelectedBcId] = useState<string>('');
  const [complexSearch, setComplexSearch] = useState('');
  const [showComplexDropdown, setShowComplexDropdown] = useState(false);
  const [docType, setDocType] = useState<'s146' | 's147' | 'cpl'>('s146');
  const [unitNumber, setUnitNumber] = useState<string>('');
  const [unitLevy, setUnitLevy] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerAddress, setOwnerAddress] = useState<string>('');
  const [lawyerName, setLawyerName] = useState<string>('');
  const [lawyerAddress, setLawyerAddress] = useState<string>('');
  const [lawyerEmail, setLawyerEmail] = useState<string>('');
  const [instalmentAmount, setInstalmentAmount] = useState<string>('');
  const [levyOutstanding, setLevyOutstanding] = useState<string>('');
  const [legalProceedings, setLegalProceedings] = useState<boolean>(false);
  const [ruleChangeAfterS146, setRuleChangeAfterS146] = useState(false);
  const [pcdsPreparationDate, setPcdsPreparationDate] = useState('');
  const [waterReadingDate, setWaterReadingDate] = useState('');
  const [waterAmountOutstanding, setWaterAmountOutstanding] = useState('');
  const [docxTemplates, setDocxTemplates] = useState<Partial<Record<string, TemplateFileRecord>>>({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [invoiceEnabled, setInvoiceEnabled] = useState(false);
  const [invoiceTierId, setInvoiceTierId] = useState('');
  const [invoiceCustomAmount, setInvoiceCustomAmount] = useState('');
  const [invoiceCreating, setInvoiceCreating] = useState(false);
  const [invoiceSuccess, setInvoiceSuccess] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<'docx' | null>(null);

  const selectedComplex = complexes.find(c => c.id === selectedBcId);
  const activeTier = pricingTiers.find(t => t.id === invoiceTierId);
  const invoiceAmount = invoiceTierId === 'other'
    ? invoiceCustomAmount
    : (activeTier ? String(activeTier.amountExclGst) : '');
  const duplicateInvoice = invoiceEnabled && selectedBcId && unitNumber.trim()
    ? invoices.find(inv =>
        inv.complexId === selectedBcId &&
        inv.documentType === docType.toUpperCase() &&
        inv.unitReference.toLowerCase().trim() === unitNumber.toLowerCase().trim() &&
        !inv.recoveredAt
      )
    : undefined;
  const _wdesc = (selectedComplex?.waterRateDescription || '').toLowerCase();
  const isBcOnCharged = (_wdesc.includes('on-charged') || _wdesc.includes('on charged')) &&
    !_wdesc.includes('utility agent') && !_wdesc.includes('third party');
  const filteredComplexes = complexSearch
    ? complexes.filter(c => c.name.toLowerCase().includes(complexSearch.toLowerCase()) || c.bcNumber.toLowerCase().includes(complexSearch.toLowerCase()))
    : complexes;
  const broker = contractors.find(c => c.name === selectedComplex?.insuranceBroker);
  const manager = managers.find(m => m.name === selectedComplex?.managerName);
  const currentTemplate = docxTemplates[docType];

  useEffect(() => {
    const keys = ['s146', 's147', 'cpl'];
    Promise.all(keys.map(k => getDoc(doc(db, 'templates_v2', k)))).then(snaps => {
      const loaded: Partial<Record<string, TemplateFileRecord>> = {};
      snaps.forEach((snap, i) => { if (snap.exists()) loaded[keys[i]] = snap.data() as TemplateFileRecord; });
      setDocxTemplates(loaded);
    });
  }, []);

  useEffect(() => {
    setUnitNumber('');
    setUnitLevy('');
    setOwnerName('');
    setOwnerAddress('');
    setLawyerName('');
    setLawyerAddress('');
    setLawyerEmail('');
    setInstalmentAmount('');
    setLevyOutstanding('');
    setLegalProceedings(false);
    setRuleChangeAfterS146(false);
    setPcdsPreparationDate('');
    setWaterReadingDate('');
    setWaterAmountOutstanding('');
    setPreviewHtml('');
    setInvoiceEnabled(false);
    setInvoiceTierId('');
    setInvoiceCustomAmount('');
    setInvoiceSuccess(false);
    setPendingDownload(null);
    setShowDuplicateConfirm(false);
  }, [selectedBcId]);

  const formatStatutory = (isYes?: boolean, details?: string) =>
    !isYes ? 'No' : (details ? `Yes - ${details}` : 'Yes');

  const getInsuranceNoting = (brk?: Contractor) => {
    if (!brk) return 'TBC';
    if (brk.notingRequirements?.length) return `${brk.name} (${brk.notingRequirements.map(r => r.detail).join(', ')})`;
    return `${brk.name} (${brk.email || 'info@prop101.co.nz'})`;
  };

  const buildMergeData = (): Record<string, string> => {
    if (!selectedComplex) return {};
    const fyDates = deriveFyDates(selectedComplex.financialYearStart || '1 April', selectedComplex.financialYearEnd || '31 March');
    const hasRemediation = selectedComplex.weathertightnessClaimMade || selectedComplex.weathertightnessRemediatedWithoutClaim || selectedComplex.weathertightnessNotRemediated || selectedComplex.remedialWorkDone;
    const remediationText = hasRemediation
      ? 'You will need to arrange for the statement to be signed before providing it to any interested parties. Therefore, please ensure the document is checked for accuracy prior to signing. Especially with regard to item (1)(a) & disclosing information on the levies & remedial project as per updates provided to owners by the Body Corporate.'
      : 'You will need to arrange for the statement to be signed before providing it to any interested parties. Therefore, please ensure the document is checked for accuracy prior to signing.';
    const vals = {
      bcName:               selectedComplex.name,
      bcNumber:             selectedComplex.bcNumber,
      bcAddress:            selectedComplex.address,
      currentDate:          new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }),
      unitNumber:           unitNumber || '[Unit]',
      unitLevy:             formatNZD(unitLevy, '[Levy Amount]'),
      ownerName:            ownerName || '[Owner Name]',
      ownersAddress:        ownerAddress || '[Owner Address]',
      fyStart:              fyDates.fyStart,
      fyEnd:                fyDates.fyEnd,
      lastFinancialStatement: fyDates.lastFinancialStatement,
      insuranceNoting:      getInsuranceNoting(broker),
      insuranceUnderwriter: selectedComplex.insuranceUnderwriter || 'TBC',
      insuranceExpiry:      selectedComplex.insuranceExpiry || 'TBC',
      remediationText,
      managerName:          manager?.name || selectedComplex.managerName || '',
      managerTitle:         manager?.title || 'Body Corporate Manager',
      managerEmail:         manager?.email || '',
      weathertightnessClaim:         formatStatutory(selectedComplex.weathertightnessClaimMade, selectedComplex.weathertightnessClaimDetails),
      weathertightnessRemediated:    formatStatutory(selectedComplex.weathertightnessRemediatedWithoutClaim, selectedComplex.weathertightnessRemediatedDetails),
      weathertightnessNotRemediated: formatStatutory(selectedComplex.weathertightnessNotRemediated, selectedComplex.weathertightnessNotRemediatedDetails),
      earthquakeProne:               formatStatutory(selectedComplex.earthquakeProneIssues, selectedComplex.earthquakeProneDetails),
      anyOtherSignificantDefects:    formatStatutory(selectedComplex.anyOtherSignificantDefects, selectedComplex.anyOtherSignificantDefectsDetails),
      proceedingsInCourt:            formatStatutory(selectedComplex.involvedInProceedings, selectedComplex.proceedingsInCourt),
      proceedingsPendingAgainst:     selectedComplex.proceedingsPendingAgainst ? 'Yes' : 'No',
      proceedingsInitiatedBy:        selectedComplex.proceedingsInitiatedBy ? 'Yes' : 'No',
      proceedingsIntendedToInitiate: selectedComplex.proceedingsIntendedToInitiate ? 'Yes' : 'No',
      writtenClaimByBC:              selectedComplex.writtenClaimByBC ? 'Yes' : 'No',
      operatingFundBalance: formatNZD(selectedComplex.operatingFundBalance),
      reserveFundBalance:   formatNZD(selectedComplex.reserveFundBalance),
      ltmpLastRenewal:      selectedComplex.ltmpLastRenewalDate
        ? new Date(selectedComplex.ltmpLastRenewalDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
        : '[Date]',
      ltmpNextRenewal:      deriveLtmpNextRenewal(selectedComplex.ltmpLastRenewalDate || ''),
      ltmpPreparedBy:       selectedComplex.ltmpCompletedBy || '',
      waterRate:            selectedComplex.waterRateDescription || '[Rate Details]',
      waterRateProvider:    (() => { const a = contractors.find(c => c.id === selectedComplex.waterRateContractorId); return a?.name || ''; })(),
      waterRateProviderPhone: (() => { const a = contractors.find(c => c.id === selectedComplex.waterRateContractorId); return a?.phone ? `Phone Number: ${a.phone}` : ''; })(),
      waterRateProviderEmail: (() => { const a = contractors.find(c => c.id === selectedComplex.waterRateContractorId); return a?.email ? `Email: ${a.email}` : ''; })(),
      gstText:              selectedComplex.isGstRegistered ? 'inclusive of GST' : '',
      brokerNoting:         broker?.notingInstructions || '',
      brokerName:           broker?.name || '',
      lawyerName:           lawyerName || '[Lawyer Name]',
      lawyerAddress:        lawyerAddress || '[Lawyer Address]',
      lawyerEmail:          lawyerEmail || '[Lawyer Email]',
      bcAccountName:        selectedComplex.bcAccountName || '[Account Name]',
      bcAccountNumber:      selectedComplex.bcAccountNumber || '[Account Number]',
      levyInstalments:      selectedComplex.levyInstalments || '[Number]',
      levyDueDates:         selectedComplex.levyDueDates || '[Due Dates]',
      instalmentAmount:     formatNZD(instalmentAmount, '[Instalment Amount]'),
      levyOutstanding:      formatNZD(levyOutstanding, '[Outstanding Amount]'),
      legalProceedings:     legalProceedings ? 'has been' : 'has not been',
      ruleChangeAfterS146:  ruleChangeAfterS146 ? 'have' : 'have not',
      meteredCharges:       isBcOnCharged ? 'are' : 'are not',
      waterReadingDate:     (() => {
        if (!waterReadingDate) return '[Reading Date]';
        const d = new Date(waterReadingDate + 'T00:00:00');
        const day = d.getDate().toString().padStart(2, '0');
        const month = d.toLocaleString('en-NZ', { month: 'long' });
        return `${day} ${month} ${d.getFullYear()}`;
      })(),
      waterAmountOutstanding: formatNZD(waterAmountOutstanding, '[Amount]'),
      pcdsPreparationDate:  (() => {
        if (!pcdsPreparationDate) return '[PCDS Date]';
        const d = new Date(pcdsPreparationDate + 'T00:00:00');
        const day = d.getDate().toString().padStart(2, '0');
        const month = d.toLocaleString('en-NZ', { month: 'long' });
        return `${day} ${month} ${d.getFullYear()}`;
      })(),
    };
    // Provide both TitleCase and lowercase_underscore variants so the template works
    // regardless of which naming convention was used when designing the Word file.
    return {
      // TitleCase
      BC_Name: vals.bcName, BC_Number: vals.bcNumber, BC_Address: vals.bcAddress,
      Current_Date: vals.currentDate, Unit_Number: vals.unitNumber, Unit_Levy: vals.unitLevy,
      Owner_Name: vals.ownerName, Owners_Address: vals.ownersAddress,
      FY_Start: vals.fyStart, FY_End: vals.fyEnd, Last_Financial_Statement: vals.lastFinancialStatement,
      Insurance_Noting: vals.insuranceNoting, Insurance_Underwriter: vals.insuranceUnderwriter, Insurance_Expiry: vals.insuranceExpiry,
      Remediation_Text: vals.remediationText,
      Manager_Name: vals.managerName, Manager_Title: vals.managerTitle, Manager_Email: vals.managerEmail,
      Weathertightness_Claim: vals.weathertightnessClaim, Weathertightness_Remediated: vals.weathertightnessRemediated,
      Weathertightness_Not_Remediated: vals.weathertightnessNotRemediated,
      Earthquake_Prone: vals.earthquakeProne, Any_Other_Significant_Defects: vals.anyOtherSignificantDefects,
      Proceedings_In_Court: vals.proceedingsInCourt,
      Proc_Pending_Against: vals.proceedingsPendingAgainst,
      Proc_Initiated_By: vals.proceedingsInitiatedBy,
      Proc_Intended_To_Initiate: vals.proceedingsIntendedToInitiate,
      Written_Claim_By_BC: vals.writtenClaimByBC,
      Operating_Fund_Balance: vals.operatingFundBalance, Reserve_Fund_Balance: vals.reserveFundBalance,
      LTMP_Last_Renewal: vals.ltmpLastRenewal, LTMP_Last_Renewal_Date: vals.ltmpLastRenewal,
      LTMP_Next_Renewal: vals.ltmpNextRenewal, LTMP_Next_Renewal_Date: vals.ltmpNextRenewal,
      LTMP_Prepared_By: vals.ltmpPreparedBy,
      Water_Rate: vals.waterRate, Water_Rate_Provider: vals.waterRateProvider,
      Water_Rate_Provider_Phone: vals.waterRateProviderPhone, Water_Rate_Provider_Email: vals.waterRateProviderEmail,
      Gst_Text: vals.gstText, Broker_Noting: vals.brokerNoting, Broker: vals.brokerName, Broker_Name: vals.brokerName,
      Lawyer_Name: vals.lawyerName, Lawyer_Address: vals.lawyerAddress, Lawyer_Email: vals.lawyerEmail,
      BC_Account_Name: vals.bcAccountName, BC_Account_Number: vals.bcAccountNumber,
      Levy_Instalments: vals.levyInstalments, Levy_Due_Dates: vals.levyDueDates,
      Instalment_Amount: vals.instalmentAmount, Levy_Outstanding: vals.levyOutstanding,
      Legal_Proceedings: vals.legalProceedings,
      Rule_change_after_S146_issued: vals.ruleChangeAfterS146,
      PCDS_Preparation_Date: vals.pcdsPreparationDate,
      Insurance_Company: vals.insuranceUnderwriter,
      Metered_Charges: vals.meteredCharges,
      Water_Reading_Date: vals.waterReadingDate,
      Water_Amount_Outstanding: vals.waterAmountOutstanding,
      // lowercase_underscore (matches old HTML template tag names)
      bc_name: vals.bcName, bc_number: vals.bcNumber, address: vals.bcAddress,
      current_date: vals.currentDate, unit_number: vals.unitNumber, unit_levy: vals.unitLevy,
      owner_name: vals.ownerName, owners_address: vals.ownersAddress,
      fy_start: vals.fyStart, fy_end: vals.fyEnd, last_financial_statement: vals.lastFinancialStatement,
      insurance_noting: vals.insuranceNoting, insurance_underwriter: vals.insuranceUnderwriter, insurance_expiry: vals.insuranceExpiry,
      remediation_text: vals.remediationText,
      manager_name: vals.managerName, manager_title: vals.managerTitle, manager_email: vals.managerEmail,
      weathertightness_claim: vals.weathertightnessClaim, weathertightness_remediated: vals.weathertightnessRemediated,
      weathertightness_not_remediated: vals.weathertightnessNotRemediated,
      earthquake_prone: vals.earthquakeProne, any_other_significant_defects: vals.anyOtherSignificantDefects,
      proceedings_in_court: vals.proceedingsInCourt,
      proc_pending_against: vals.proceedingsPendingAgainst,
      proc_initiated_by: vals.proceedingsInitiatedBy,
      proc_intended_to_initiate: vals.proceedingsIntendedToInitiate,
      written_claim_by_bc: vals.writtenClaimByBC,
      operating_fund_balance: vals.operatingFundBalance, reserve_fund_balance: vals.reserveFundBalance,
      ltmp_last_renewal: vals.ltmpLastRenewal, ltmp_last_renewal_date: vals.ltmpLastRenewal,
      ltmp_next_renewal: vals.ltmpNextRenewal, ltmp_next_renewal_date: vals.ltmpNextRenewal,
      ltmp_prepared_by: vals.ltmpPreparedBy,
      water_rate: vals.waterRate, water_rate_provider: vals.waterRateProvider,
      water_rate_provider_phone: vals.waterRateProviderPhone, water_rate_provider_email: vals.waterRateProviderEmail,
      gst_text: vals.gstText, broker_noting: vals.brokerNoting, broker: vals.brokerName, broker_name: vals.brokerName,
      lawyer_name: vals.lawyerName, lawyer_address: vals.lawyerAddress, lawyer_email: vals.lawyerEmail,
      bc_account_name: vals.bcAccountName, bc_account_number: vals.bcAccountNumber,
      levy_instalments: vals.levyInstalments, levy_due_dates: vals.levyDueDates,
      instalment_amount: vals.instalmentAmount, levy_outstanding: vals.levyOutstanding,
      legal_proceedings: vals.legalProceedings,
      rule_change_after_s146_issued: vals.ruleChangeAfterS146,
      pcds_preparation_date: vals.pcdsPreparationDate,
      insurance_company: vals.insuranceUnderwriter,
      metered_charges: vals.meteredCharges,
      water_reading_date: vals.waterReadingDate,
      water_amount_outstanding: vals.waterAmountOutstanding,
    };
  };

  const doCreateInvoice = async () => {
    if (!selectedComplex || !invoiceAmount || parseFloat(invoiceAmount) <= 0) return;
    setInvoiceCreating(true);
    try {
      const exclGst = parseFloat(invoiceAmount);
      const gst = parseFloat((exclGst * 0.15).toFixed(2));
      const tierName = invoiceTierId === 'other' ? 'Custom' : (activeTier?.name || docType.toUpperCase());
      await addInvoice({
        date: new Date().toISOString().split('T')[0],
        complexId: selectedComplex.id,
        complexName: selectedComplex.name,
        bcNumber: selectedComplex.bcNumber,
        documentType: docType.toUpperCase() as 'S146' | 'S147' | 'CPL',
        unitReference: unitNumber.trim() || 'TBC',
        details: `${tierName} — Unit ${unitNumber.trim() || 'TBC'}`,
        amountExclGst: exclGst,
        gstAmount: gst,
        amountInclGst: parseFloat((exclGst + gst).toFixed(2)),
        generatedBy: user?.name || 'Unknown',
        generatedAt: new Date().toISOString(),
      });
      setInvoiceSuccess(true);
      setInvoiceTierId('');
      setInvoiceCustomAmount('');
    } finally {
      setInvoiceCreating(false);
    }
  };

  const handlePreview = async () => {
    if (!currentTemplate || !selectedComplex) return;
    setPreviewing(true);
    try {
      const mammoth = await import('mammoth');
      const buffer = toArrayBuffer(currentTemplate.data);
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
      const data = buildMergeData();
      let html = result.value;
      const sigHtml = manager?.signatureUrl
        ? `<img src="${manager.signatureUrl}" style="width:200px;height:auto;display:block;margin:8px 0;" />`
        : '';
      html = html.split('{{%Manager_Signature}}').join(sigHtml);
      html = html.split('{{Manager_Signature}}').join(sigHtml);
      html = html.replace(/\{\{[\s\S]*?\}\}/g, m => '{{' + m.slice(2, -2).replace(/<[^>]*>/g, '') + '}}');
      Object.entries(data).forEach(([k, v]) => { html = html.split(`{{${k}}}`).join(v); });
      setPreviewHtml(html);
    } catch (e) {
      console.error('Preview error:', e);
      alert('Preview failed. Ensure the uploaded file is a valid .docx.');
    }
    setPreviewing(false);
  };

  const doDownloadDocx = () => {
    if (!currentTemplate || !selectedComplex) return;
    try {
      const sigUrl = manager?.signatureUrl || TRANSPARENT_GIF;
      const imageModule = new ImageModule({
        centered: false,
        fileType: 'docx',
        getImage: (tagValue: string) => dataUrlToBuffer(tagValue && tagValue.startsWith('data:') ? tagValue : TRANSPARENT_GIF),
        getSize: () => [200, 70] as [number, number],
      });
      const zip = new PizZip(toArrayBuffer(currentTemplate.data));
      const docTpl = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule],
        delimiters: { start: '{{', end: '}}' },
        nullGetter: () => '',
      });
      docTpl.render({ ...buildMergeData(), Manager_Signature: sigUrl, manager_signature: sigUrl });
      const out = docTpl.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(out as Blob);
      const bcNum = (selectedComplex.bcNumber || '').replace(/\s+/g, '');
      a.download = `${bcNum} ${selectedComplex.name} – ${docType.toUpperCase()} Unit ${unitNumber || 'TBC'}.docx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error('Word export error:', e);
      alert('Word export failed. Make sure the template uses {{Tag}} placeholders (not Word MERGEFIELD codes).');
    }
  };

  const handleDownloadDocx = async () => {
    if (!currentTemplate || !selectedComplex) return;
    if (invoiceEnabled && invoiceAmount && parseFloat(invoiceAmount) > 0) {
      if (duplicateInvoice) {
        setPendingDownload('docx');
        setShowDuplicateConfirm(true);
        return;
      }
      doDownloadDocx();
      await doCreateInvoice();
    } else {
      doDownloadDocx();
    }
  };

  const handleConfirmDuplicate = async () => {
    setShowDuplicateConfirm(false);
    if (pendingDownload === 'docx') {
      doDownloadDocx();
      await doCreateInvoice();
    }
    setPendingDownload(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FileSignature className="text-pink-600" /> Disclosure Workbench
        </h1>
        <p className="text-slate-500">Statutory S146, S147 and CPL generation engine.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border dark:border-slate-800 space-y-6">

            {/* 1. Document Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">1. Document Type</label>
              <div className="grid grid-cols-1 gap-2">
                {([
                  { id: 's146', label: 'PCDS (S146)' },
                  { id: 's147', label: 'Pre-Settlement (S147)' },
                  { id: 'cpl',  label: 'PL Certificate (CPL)' },
                ] as const).map(type => (
                  <button
                    key={type.id}
                    onClick={() => { setDocType(type.id); setPreviewHtml(''); setInvoiceEnabled(false); setInvoiceTierId(''); setInvoiceCustomAmount(''); setInvoiceSuccess(false); }}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${docType === type.id ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/10' : 'border-transparent bg-slate-50 dark:bg-slate-800/50 text-slate-500'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${docType === type.id ? 'bg-pink-600' : 'bg-slate-300'}`} />
                    <span className="text-sm font-bold">{type.label}</span>
                    {!docxTemplates[type.id] && (
                      <span className="ml-auto text-[9px] text-amber-500 font-bold uppercase">No template</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Property Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">2. Property Selection</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full rounded-xl border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="Type to search complex..."
                  value={complexSearch}
                  onChange={e => { setComplexSearch(e.target.value); setSelectedBcId(''); setPreviewHtml(''); setShowComplexDropdown(true); }}
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
                        onMouseDown={() => { setSelectedBcId(bc.id); setComplexSearch(`${bc.bcNumber} - ${bc.name}`); setShowComplexDropdown(false); setPreviewHtml(''); }}
                      >
                        <span className="font-bold text-pink-600 mr-1">{bc.bcNumber}</span>{bc.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Unit Info */}
            <div className="space-y-3 pt-4 border-t dark:border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Edit3 size={14} className="text-pink-600" /> 3. Unit Info
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Unit / PU</label>
                  <input type="text" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm" placeholder="e.g. 5A" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Annual Levy ($)</label>
                  <input type="text" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm" placeholder="e.g. 4500" value={unitLevy} onChange={e => setUnitLevy(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Current Owner(s)</label>
                <input type="text" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm" placeholder="e.g. John Doe" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
              </div>
              {docType !== 's147' && (
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Owner's Address</label>
                  <textarea rows={2} className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm resize-none" placeholder="e.g. 12 Example St, Auckland 1010" value={ownerAddress} onChange={e => setOwnerAddress(e.target.value)} />
                </div>
              )}
              {docType === 's147' && (
                <>
                  <div className="pt-3 border-t dark:border-slate-800 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Rule Change After S146 Issued?</label>
                      <select
                        className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                        value={ruleChangeAfterS146 ? 'yes' : 'no'}
                        onChange={e => setRuleChangeAfterS146(e.target.value === 'yes')}
                      >
                        <option value="no">No — have not</option>
                        <option value="yes">Yes — have</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">PCDS Preparation Date</label>
                      <input type="date" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-500" value={pcdsPreparationDate} onChange={e => setPcdsPreparationDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="pt-3 border-t dark:border-slate-800">
                    <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Lawyer Name</label>
                    <input type="text" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm" placeholder="e.g. Jane Smith" value={lawyerName} onChange={e => setLawyerName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Lawyer Address (C/-)</label>
                    <textarea rows={2} className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm resize-none" placeholder="e.g. Smith & Co, 1 Law St, Auckland" value={lawyerAddress} onChange={e => setLawyerAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Lawyer Email</label>
                    <input type="email" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm" placeholder="e.g. jane@smithco.co.nz" value={lawyerEmail} onChange={e => setLawyerEmail(e.target.value)} />
                  </div>
                  <div className="pt-3 border-t dark:border-slate-800">
                    <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Instalment Amount ($)</label>
                    <input type="text" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm" placeholder="e.g. 1125" value={instalmentAmount} onChange={e => setInstalmentAmount(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Levy Outstanding as at Date of Preparation ($)</label>
                    <input type="text" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm" placeholder="e.g. 0" value={levyOutstanding} onChange={e => setLevyOutstanding(e.target.value)} />
                  </div>
                  {isBcOnCharged && (
                    <div className="pt-3 border-t dark:border-slate-800 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Last Water Reading Date</label>
                        <input type="date" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-500" value={waterReadingDate} onChange={e => setWaterReadingDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Water Amount Outstanding ($)</label>
                        <input type="text" className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm" placeholder="e.g. 0" value={waterAmountOutstanding} onChange={e => setWaterAmountOutstanding(e.target.value)} />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Legal Proceedings?</label>
                    <button
                      type="button"
                      onClick={() => setLegalProceedings(p => !p)}
                      className={`flex items-center gap-3 w-full p-2.5 rounded-lg border text-sm font-bold transition-all ${legalProceedings ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                    >
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${legalProceedings ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${legalProceedings ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      {legalProceedings ? 'Yes — has been' : 'No — has not been'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                disabled={previewing || !selectedBcId || !currentTemplate}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-slate-700 hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-40"
              >
                {previewing ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                Preview
              </button>
              <button
                onClick={handleDownloadDocx}
                disabled={!selectedBcId || !currentTemplate}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2b579a] hover:bg-[#1e3f72] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-40"
              >
                <Download size={16} /> Word
              </button>
            </div>

            {selectedBcId && !currentTemplate && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={12} /> No {docType.toUpperCase()} template uploaded yet. Go to Admin Panel → Templates → Disclosure & CPL.
              </p>
            )}
          </div>

          {/* Invoice panel */}
          {selectedBcId && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">On-charge Invoice</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setInvoiceEnabled(p => !p); setInvoiceSuccess(false); setInvoiceTierId(''); setInvoiceCustomAmount(''); }}
                  className={`flex items-center w-10 h-5 rounded-full p-0.5 transition-colors ${invoiceEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${invoiceEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {invoiceEnabled && (
                <>
                  {duplicateInvoice && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span><strong>Warning:</strong> An unrecovered invoice already exists for {docType.toUpperCase()} Unit {unitNumber} — created {new Date(duplicateInvoice.generatedAt).toLocaleDateString('en-NZ')} by {duplicateInvoice.generatedBy} (${duplicateInvoice.amountInclGst.toFixed(2)} incl. GST). You will be asked to confirm when downloading.</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Invoice Amount</label>
                    <select
                      className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      value={invoiceTierId}
                      onChange={e => { setInvoiceTierId(e.target.value); setInvoiceCustomAmount(''); setInvoiceSuccess(false); }}
                    >
                      <option value="">— Select amount —</option>
                      {pricingTiers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} (${t.amountExclGst.toFixed(2)} + GST)</option>
                      ))}
                      <option value="other">Other (enter custom amount)</option>
                    </select>
                  </div>

                  {invoiceTierId === 'other' && (
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Custom Amount excl. GST ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 text-sm"
                        placeholder="e.g. 150.00"
                        value={invoiceCustomAmount}
                        onChange={e => { setInvoiceCustomAmount(e.target.value); setInvoiceSuccess(false); }}
                      />
                    </div>
                  )}

                  {invoiceAmount && parseFloat(invoiceAmount) > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Excl. GST</span>
                        <span className="font-mono font-bold dark:text-white">${parseFloat(invoiceAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">GST (15%)</span>
                        <span className="font-mono font-bold dark:text-white">${(parseFloat(invoiceAmount) * 0.15).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t dark:border-slate-700 pt-1 mt-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Incl. GST</span>
                        <span className="font-mono font-bold text-emerald-600">${(parseFloat(invoiceAmount) * 1.15).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {invoiceSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                      <CheckCircle2 size={14} /> Invoice created and attached to this document download
                    </div>
                  )}

                  {invoiceCreating && (
                    <div className="flex items-center gap-2 p-2 text-xs text-slate-500">
                      <Loader2 size={12} className="animate-spin" /> Creating invoice...
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400">Invoice will be created automatically when you click <strong>Word</strong> to download.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right panel — preview */}
        <div className="lg:col-span-3 bg-slate-200 dark:bg-slate-950 rounded-3xl border border-slate-300 dark:border-slate-800 min-h-[700px] flex flex-col overflow-hidden shadow-inner">
          {previewHtml ? (
            <div className="flex flex-col h-full">
              <div className="p-4 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex justify-between items-center shadow-sm shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Previewing Package:</span>
                  <span className="text-sm font-bold text-pink-600 uppercase tracking-widest">{docType.toUpperCase()}</span>
                </div>
                <button
                  onClick={handleDownloadDocx}
                  className="bg-[#2b579a] hover:bg-[#1e3f72] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all uppercase"
                >
                  <Download size={14} /> Export to Word
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  title="Disclosure Preview"
                  srcDoc={buildIframeSrcDoc(previewHtml)}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                <FileText size={40} className="opacity-10 text-pink-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Preview Engine Ready</h3>
              <p className="max-w-xs mt-2 text-sm italic">Select a property and click Preview to see the merged document from your uploaded Word template.</p>
            </div>
          )}
        </div>
      </div>
      {/* Duplicate invoice confirmation modal */}
      {showDuplicateConfirm && duplicateInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Duplicate Invoice Warning</h3>
                <p className="text-sm text-slate-500 mt-1">
                  An unrecovered invoice already exists for <strong>{docType.toUpperCase()} Unit {unitNumber}</strong>:<br />
                  Created {new Date(duplicateInvoice.generatedAt).toLocaleDateString('en-NZ')} by {duplicateInvoice.generatedBy} — <span className="font-mono">${duplicateInvoice.amountInclGst.toFixed(2)} incl. GST</span>
                </p>
                <p className="text-sm text-slate-500 mt-2">Do you want to proceed and create another invoice?</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowDuplicateConfirm(false); setPendingDownload(null); }}
                className="flex-1 py-2.5 rounded-xl border dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDuplicate}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors"
              >
                Yes, proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisclosureGenerator;
