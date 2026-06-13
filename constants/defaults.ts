import { WorkflowStepConfig, InsuranceSettings, MeetingChecklistItem, MeetingDateSettings } from '../types';

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

type StageTemplates = { NOI: MeetingChecklistItem[]; NOM: MeetingChecklistItem[]; PRIOR_TO_MEETING: MeetingChecklistItem[]; AFTER_MEETING: MeetingChecklistItem[] };

export const DEFAULT_MEETING_CHECKLIST: { bc: StageTemplates; rs: StageTemplates } = {
  bc: {
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
    PRIOR_TO_MEETING: [
      { id: 'pre_1', label: 'Confirm venue and Zoom link' },
      { id: 'pre_2', label: 'Send meeting pack to attendees' },
      { id: 'pre_3', label: 'Confirm quorum requirements' }
    ],
    AFTER_MEETING: [
      { id: 'post_1', label: 'Draft post-meeting minutes' },
      { id: 'post_2', label: 'Update levy schedules' },
      { id: 'post_3', label: 'Issue meeting summary to all owners' }
    ]
  },
  rs: {
    NOI: [
      { id: 'rs_noi_1', label: 'Review previous minutes' },
      { id: 'rs_noi_2', label: 'Confirm committee member list' }
    ],
    NOM: [
      { id: 'rs_nom_1', label: 'Draft proposed agenda' },
      { id: 'rs_nom_2', label: 'Check for rule change requirements' }
    ],
    PRIOR_TO_MEETING: [
      { id: 'rs_pre_1', label: 'Confirm venue and Zoom link' },
      { id: 'rs_pre_2', label: 'Send meeting pack to members' },
      { id: 'rs_pre_3', label: 'Confirm quorum requirements' }
    ],
    AFTER_MEETING: [
      { id: 'rs_post_1', label: 'Draft post-meeting minutes' },
      { id: 'rs_post_2', label: 'Issue meeting summary to all members' }
    ]
  }
};

export const DEFAULT_BWOF_MESSAGE = "Please confirm that you have received the signed BWOF 12A certificate from the compliance company and it has been uploaded to the complex OneDrive folder before advancing the expiry date.";

export const DEFAULT_MEETING_DATE_SETTINGS: { bc: MeetingDateSettings; rs: MeetingDateSettings } = {
  bc: {
    noiPreferDays: 35,
    noiDeadlineDays: 21,
    nomPreferDays: 21,
    nomDeadlineDays: 14,
    minutesPreferDays: 7,
    minutesDeadlineDays: 14,
  },
  rs: {
    noiPreferDays: 28,
    noiDeadlineDays: 21,
    nomPreferDays: 14,
    nomDeadlineDays: 7,
    minutesPreferDays: 14,
    minutesDeadlineDays: 28,
  },
};
