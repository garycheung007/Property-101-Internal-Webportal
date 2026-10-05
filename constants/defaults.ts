import { WorkflowStepConfig, InsuranceSettings, MeetingChecklistItem, MeetingDateSettings, InvoicePricingTier, PostMeetingField, OnboardingChecklistSection } from '../types';

export const DEFAULT_ONBOARDING_CHECKLIST: OnboardingChecklistSection[] = [
  {
    id: 'admin-file-setup', label: 'Admin & File Setup', assignedTeam: 'Admin',
    tasks: [
      { id: 'afs-1', label: 'Transfer electronic folder from Marketing' },
      { id: 'afs-2', label: 'Update Properties Register', isMandatory: true },
      { id: 'afs-3', label: 'Save setup / handover documents' },
      { id: 'afs-4', label: 'Create contractor list (check against approved budget)' },
      { id: 'afs-5', label: 'Create owners list with unit entitlements', isMandatory: true },
      { id: 'afs-6', label: 'Create committee list', isMandatory: true },
      { id: 'afs-7', label: 'Update portfolio calendar — FYE and all meetings' },
      { id: 'afs-8', label: 'Confirm electricity / power accounts', isMandatory: true },
    ],
  },
  {
    id: 'required-docs', label: 'Required Documents', assignedTeam: 'Admin',
    tasks: [
      { id: 'rd-1', label: 'Management Agreement', isMandatory: true },
      { id: 'rd-2', label: 'Letter of Appointment', isMandatory: true },
      { id: 'rd-3', label: 'Constitution', isMandatory: true, isISOCOnly: true },
      { id: 'rd-4', label: 'Certificate of Incorporation', isMandatory: true, isISOCOnly: true },
      { id: 'rd-5', label: 'Body Corporate Rules', isMandatory: true, isBCOnly: true },
      { id: 'rd-6', label: 'Insurance Policy', isMandatory: true },
      { id: 'rd-7', label: 'Insurance Valuation', isMandatory: true },
      { id: 'rd-8', label: 'Approved Budget', isMandatory: true },
      { id: 'rd-9', label: 'Owners list with unit entitlements', isMandatory: true },
      { id: 'rd-10', label: 'Opening Resolutions', isMandatory: true },
    ],
  },
  {
    id: 'isoc-requirements', label: 'ISOC Requirements', assignedTeam: 'Admin',
    tasks: [
      { id: 'isoc-1', label: 'Read constitution & record key requirements in notes', isMandatory: true, isISOCOnly: true },
      { id: 'isoc-2', label: 'Record default interest provisions', isMandatory: true, isISOCOnly: true },
      { id: 'isoc-3', label: 'Confirm Certificate of Incorporation received', isMandatory: true, isISOCOnly: true },
      { id: 'isoc-4', label: 'Confirm incorporation completed in Societies Register', isMandatory: true, isISOCOnly: true },
      { id: 'isoc-5', label: 'Obtain garden & landscaping quotes', isISOCOnly: true },
    ],
  },
  {
    id: 'banking-finance', label: 'Banking & Finance', assignedTeam: 'Finance',
    tasks: [
      { id: 'bf-1', label: 'Confirm bank account name & number', isMandatory: true },
      { id: 'bf-2', label: 'Confirm GST status', isMandatory: true },
      { id: 'bf-3', label: 'Complete IRD number application (if new entity)', isMandatory: true },
      { id: 'bf-4', label: 'Enter owner levies & opening balances', isMandatory: true },
      { id: 'bf-5', label: 'Enter revenue & income' },
      { id: 'bf-6', label: 'Enter fund surplus / deficit (opening balances)' },
      { id: 'bf-7', label: 'Set up and load approved budget', isMandatory: true },
    ],
  },
  {
    id: 'usm-setup', label: 'USM Setup', assignedTeam: 'Admin',
    tasks: [
      { id: 'usm-1', label: 'Add property to USM', isMandatory: true },
      { id: 'usm-2', label: 'Enter important dates & financial year start' },
      { id: 'usm-3', label: 'Set up bank account details', isMandatory: true },
      { id: 'usm-4', label: 'Set up levy settings & payment slip message', isMandatory: true },
      { id: 'usm-5', label: 'Add insurance policy & upload Certificate of Insurance' },
      { id: 'usm-6', label: 'Add lots & units (OI and UI)', isMandatory: true },
      { id: 'usm-7', label: 'Add owners (verify against Certificate of Title)', isMandatory: true },
      { id: 'usm-8', label: 'Set up maintenance contractors in USM' },
      { id: 'usm-9', label: 'Confirm debt collection reminder settings' },
      { id: 'usm-10', label: 'Add committee members' },
      { id: 'usm-11', label: 'Set up correspondence preferences' },
    ],
  },
  {
    id: 'waste-services', label: 'Waste Services', assignedTeam: 'Admin',
    tasks: [
      { id: 'ws-1', label: 'Obtain ICP (Independent Consumer Point) reference', isMandatory: true },
      { id: 'ws-2', label: 'Confirm waste contractor & collection days', isMandatory: true },
      { id: 'ws-3', label: 'Arrange recycling and general waste bins' },
      { id: 'ws-4', label: 'Confirm bin storage area and labelling' },
    ],
  },
  {
    id: 'mycommunity', label: 'MyCommunity / Resident Portal', assignedTeam: 'Admin',
    tasks: [
      { id: 'mc-1', label: 'Create MyCommunity portal site', isMandatory: true },
      { id: 'mc-2', label: 'Add owners / residents to portal', isMandatory: true },
      { id: 'mc-3', label: 'Upload key documents (constitution / rules, insurance)' },
      { id: 'mc-4', label: 'Set up notice board' },
      { id: 'mc-5', label: 'Configure payment portal (if applicable)' },
      { id: 'mc-6', label: 'Send welcome email to all owners', isMandatory: true },
    ],
  },
  {
    id: 'contractors', label: 'Contractors & Critical Services', assignedTeam: 'Admin',
    tasks: [
      { id: 'con-1', label: 'Confirm building manager (if applicable)' },
      { id: 'con-2', label: 'Confirm cleaning contractor' },
      { id: 'con-3', label: 'Confirm garden / landscaping contractor' },
      { id: 'con-4', label: 'Confirm lift maintenance contractor (if applicable)' },
      { id: 'con-5', label: 'Confirm fire protection contractor', isMandatory: true },
      { id: 'con-6', label: 'Confirm pest control contractor' },
      { id: 'con-7', label: 'Advise all contractors of management start date', isMandatory: true },
    ],
  },
  {
    id: 'management-review', label: 'Management Review', assignedTeam: 'Manager',
    tasks: [
      { id: 'mr-1', label: 'All mandatory documents received and filed', isMandatory: true },
      { id: 'mr-2', label: 'Owners list verified against Certificates of Title', isMandatory: true },
      { id: 'mr-3', label: 'Insurance arranged and Certificate of Insurance received', isMandatory: true },
      { id: 'mr-4', label: 'Bank account confirmed and entered in USM', isMandatory: true },
      { id: 'mr-5', label: 'USM setup complete and tested', isMandatory: true },
      { id: 'mr-6', label: 'Levy schedule entered and tested', isMandatory: true },
      { id: 'mr-7', label: 'All contractors notified of start date', isMandatory: true },
      { id: 'mr-8', label: 'Welcome letter / email sent to all owners', isMandatory: true },
      { id: 'mr-9', label: 'First meeting (AGM/EGM) scheduled', isMandatory: true },
      { id: 'mr-10', label: 'Committee list confirmed', isMandatory: true },
      { id: 'mr-11', label: 'MyCommunity portal live', isMandatory: true },
      { id: 'mr-12', label: 'Financial year end confirmed in USM', isMandatory: true },
      { id: 'mr-13', label: 'Manager reviewed all setup — sign off', isMandatory: true },
    ],
  },
];

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

export const DEFAULT_INVOICE_PRICING_TIERS: InvoicePricingTier[] = [
  { id: 'tier_s146_std',  name: 'Standard S146 (PCDS)',         amountExclGst: 150 },
  { id: 'tier_s147_std',  name: 'Standard S147 (Pre-Settlement)', amountExclGst: 150 },
  { id: 'tier_cpl_std',   name: 'Standard CPL',                  amountExclGst: 100 },
];

export const DEFAULT_BWOF_MESSAGE = "Please confirm that you have received the signed BWOF 12A certificate from the compliance company and it has been uploaded to the complex OneDrive folder before advancing the expiry date.";

export const DEFAULT_POST_MEETING_FIELDS: PostMeetingField[] = [
  { id: 'pmf_levy',      label: 'No. of Levy Instalments', fieldKey: 'levyInstalments',           required: true },
  { id: 'pmf_budget',    label: 'Annual Levy Budget',       fieldKey: 'approvedBudget' },
  { id: 'pmf_operating', label: 'Operating Fund Balance',   fieldKey: 'operatingFundBalance' },
  { id: 'pmf_reserve',   label: 'Reserve Fund Balance',     fieldKey: 'reserveFundBalance' },
];

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
