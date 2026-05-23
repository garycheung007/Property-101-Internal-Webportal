import { WorkflowStepConfig, InsuranceSettings, MeetingChecklistItem } from '../types';

export const DEFAULT_CATEGORIES: string[] = [
  'Insurance Broker',
  'Insurance Valuer',
  'Insurance Underwriter',
  'Building Manager',
  'Compliance',
  'Consultant',
  'General'
];

export const DEFAULT_WORKFLOW: WorkflowStepConfig[] = [
  { id: 'wf_val',           label: '1. Valuation Check (System Verified)',       offsetDays: 90, type: 'prior', isValuationCheck: true },
  { id: 'wf_q_send',        label: '2. Send Questionnaire to Owners',            offsetDays: 90, type: 'prior' },
  { id: 'wf_q_ans',         label: '3. Return Answers to Broker',                offsetDays: 60, type: 'prior' },
  { id: 'wf_quote_fup',     label: '4. Follow up Broker for Quote (30d Prior)',  offsetDays: 30, type: 'prior' },
  { id: 'wf_comm_send',     label: '5. Send to BCM/Committee for Approval',      offsetDays: 14, type: 'prior' },
  { id: 'wf_comm_fup',      label: '6. Follow up Committee Approval (7d Prior)', offsetDays: 7,  type: 'prior' },
  { id: 'wf_instr_send',    label: '7. Send Renewal Instruction to Broker',      offsetDays: 1,  type: 'prior' },
  { id: 'wf_doc_rcpt',      label: '8. Receive Renewed Documents (14d Follow-up)',offsetDays: 14, type: 'after' },
  { id: 'wf_file_one_complex', label: '9a. Save to OneDrive (Complex Folder)',   offsetDays: 15, type: 'after' },
  { id: 'wf_file_one_disc', label: '9b. Save to OneDrive (Disclosure Supporting)',offsetDays: 15, type: 'after', isBcOnly: true },
  { id: 'wf_file_usm_upld', label: '9c. Upload to USM Portal',                  offsetDays: 16, type: 'after' },
  { id: 'wf_file_usm_udt',  label: '9d. Update USM Details & Expiry',           offsetDays: 16, type: 'after' }
];

export const DEFAULT_INSURANCE_SETTINGS: InsuranceSettings = {
  valuationValidityYears: 2,
  workflowSteps: DEFAULT_WORKFLOW
};

export const DEFAULT_MEETING_CHECKLIST: { NOI: MeetingChecklistItem[]; NOM: MeetingChecklistItem[]; COMPLETE: MeetingChecklistItem[] } = {
  NOI: [
    { id: 'noi_1', label: 'Review previous minutes' },
    { id: 'noi_2', label: 'Verify financial year end records' },
    { id: 'noi_3', label: 'Confirm committee member list' }
  ],
  NOM: [
    { id: 'nom_1', label: 'Draft proposed budget' },
    { id: 'nom_2', label: 'Include insurance policy summary' },
    { id: 'nom_3', label: 'Check for statutory disclosure requirements' }
  ],
  COMPLETE: [
    { id: 'c_1', label: 'Draft post-meeting minutes' },
    { id: 'c_2', label: 'Update levy schedules' },
    { id: 'c_3', label: 'Issue meeting summary to all owners' }
  ]
};

export const DEFAULT_BWOF_MESSAGE = "Please confirm that you have received the signed BWOF 12A certificate from the compliance company and it has been uploaded to the complex OneDrive folder before advancing the expiry date.";
