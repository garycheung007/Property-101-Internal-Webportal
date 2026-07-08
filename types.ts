
export interface MeetingChecklistItem {
  id: string;
  label: string;
  dueDaysBeforeMeeting?: number;
}

export interface MeetingDateSettings {
  noiPreferDays: number;
  noiDeadlineDays: number;
  nomPreferDays: number;
  nomDeadlineDays: number;
  minutesPreferDays: number;
  minutesDeadlineDays: number;
}

export interface ConflictEntry {
  id: string;
  memberName: string;
  matter: string;
  conflictNature: string;
  dateDisclosed: string;
  breachOccurred: 'YES' | 'NO' | '';
  breachNotifiedDate: string;
}

export interface Meeting {
  id: string;
  type: 'AGM' | 'EGM' | 'SGM' | 'Committee';
  date: string;
  time: string;
  venue: string;
  venueAddress?: string;
  
  // Specific to AGM
  noiDueDate?: string;
  noiResponseDueDate?: string;
  noiResponseDueTime?: string;
  nomDueDate?: string;
  agendaSentDate?: string;
  minutesSentDate?: string;

  // Document Tracking
  noiIssued?: boolean;
  nomIssued?: boolean;
  noiNotApplicable?: boolean;
  minutesIssued?: boolean;
  noiIssuedDate?: string;
  nomIssuedDate?: string;
  minutesIssuedDate?: string;

  // Checklist Progress: map of itemId to boolean
  checklistProgress?: Record<string, boolean>;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  complexId: string;
  complexName: string;
  bcNumber: string;
  documentType: 'S146' | 'S147' | 'CPL' | 'Other';
  unitReference: string;
  details: string;
  amountExclGst: number;
  gstAmount: number;
  amountInclGst: number;
  generatedBy: string;
  generatedAt: string;
  recoveredAt?: string;
  recoveredBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  unrecoveryReason?: string;
}

export interface InvoicePricingTier {
  id: string;
  name: string;
  amountExclGst: number;
}

export type ComplexType = 'Body Corporate' | 'Incorporated Society';
export type OnboardingType = 'New Development' | 'Takeover';

export interface InsuranceStepStatus {
  completed: boolean;
  date?: string;
  userId?: string;
  userName?: string;
}

export interface WorkflowStepConfig {
  id: string;
  label: string;
  offsetDays: number; // Days relative to expiry
  type: 'prior' | 'after';
  isBcOnly?: boolean;
  isValuationCheck?: boolean;
}

export interface InsuranceSettings {
  valuationValidityYears: number;
  workflowSteps: WorkflowStepConfig[];
}

export interface DocumentTemplates {
  noiLetter: string;
  responseForm: string;
  noiLetterBC?: string;
  responseFormBC?: string;
  noiLetterISOC?: string;
  responseFormISOC?: string;
  s146?: string;
  s147?: string;
  cpl?: string;
}

export interface BodyCorporate {
  id: string;
  bcNumber: string; 
  name: string;
  address: string;
  units: number;
  
  type?: ComplexType;
  managerName: string;
  managementFee: number;
  managementStartDate?: string;
  onboardingType?: OnboardingType;
  isArchived?: boolean;

  financialYearStart?: string; 
  financialYearEnd: string;   
  isGstRegistered?: boolean;

  isocNomDaysPrior?: number; 
  noiNotApplicable?: boolean;

  numberOfCommitteeMeetings?: number;
  numberOfCommitteeMembers?: number;
  approvedBudget?: string;

  meetings: Meeting[];
  conflictRegister?: ConflictEntry[];

  previousAgmDate?: string;
  nextAgmDate?: string;
  nextAgmTime?: string;
  nextAgmVenue?: string;
  nextAgmVenueAddress?: string;
  noiDueDate?: string; 
  noiResponseDueDate?: string;
  noiResponseDueTime?: string;
  motionsDueBy?: string;
  nomDueDate?: string; 
  pollsDone?: boolean;
  postMeetingDocsDone?: boolean;
  minutesSent?: boolean;
  
  noiIssued?: boolean;
  nomIssued?: boolean;

  insuranceExpiry: string; 
  insuranceBroker?: string;
  insuranceUnderwriter?: string;
  lastInsuranceValuationDate?: string;
  lastInsuranceValuer?: string; 
  insuranceValuer?: string; 
  nextValuationDue?: string; 
  insuranceQuestionnaire?: string; 
  insuranceNote?: string;

  insuranceWorkflowProgress?: Record<string, InsuranceStepStatus>;

  hasBwof?: boolean;
  bwofExpiry?: string;
  bwofLastCompletionDate?: string;
  bwofNextRenewalDate?: string;
  bwofConsultant?: string; 
  complianceCompany?: string; 
  complianceContactEmail?: string;
  bofNote?: string;

  hasLtmp?: boolean; 
  ltmpCompletedDate?: string;
  ltmpCompletedBy?: string; 
  nextLtmpRenewalDate?: string; 

  hasHsReport?: boolean;
  hsReportDate?: string;
  hsReportBy?: string; 

  hasBuildingManager?: boolean;
  buildingManagerCompany?: string;
  buildingManagerName?: string;
  buildingManagerPhone?: string;
  buildingManagerEmail?: string;
  
  isocRegistrationType?: '1908' | '2022';
  isocReRegistrationNote?: string;

  lastDebtCollectionDate?: string;
  debtCollectionNote?: string;

  // Statutory Disclosure Fields
  weathertightnessClaimMade?: boolean;
  weathertightnessClaimDetails?: string;
  weathertightnessRemediatedWithoutClaim?: boolean;
  weathertightnessRemediatedDetails?: string;
  weathertightnessNotRemediated?: boolean;
  weathertightnessNotRemediatedDetails?: string;
  earthquakeProneIssues?: boolean;
  earthquakeProneDetails?: string;
  anyOtherSignificantDefects?: boolean;
  anyOtherSignificantDefectsDetails?: string;
  involvedInProceedings?: boolean;
  proceedingsInCourt?: string;
  proceedingsPendingAgainst?: boolean;
  proceedingsInitiatedBy?: boolean;
  proceedingsIntendedToInitiate?: boolean;
  writtenClaimByBC?: boolean;
  waterRateDescription?: string;
  waterRateContractorId?: string;
  operatingFundBalance?: string;
  reserveFundBalance?: string;
  remedialWorkDone?: boolean;
  remedialWorkDetails?: string;
  disclosureNote?: string;
  lastFinancialStatementBalance?: string;
  ltmpLastRenewalDate?: string;
  ltmpNextRenewalDate?: string;

  bcAccountName?: string;
  bcAccountNumber?: string;
  levyInstalments?: string;
  levyDueDates?: string;

  notes?: string;
  meetingDateSettings?: Partial<MeetingDateSettings>;
}

export type UserRole = 'admin' | 'account_manager' | 'support' | 'accounts';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string; 
  title?: string;
  phone?: string;
  signatureUrl?: string;
}

export interface SystemSettings {
  headerImageUrl?: string;
  footerImageUrl?: string;
  last_diagnostic_run?: string;
  insuranceSettings?: InsuranceSettings;
  documentTemplates?: DocumentTemplates;
  paragraphSpacing?: number;
  contractorCategories?: string[];
  bwofConfirmationMessage?: string;
  meetingChecklistTemplates?: {
    bc: { NOI: MeetingChecklistItem[]; NOM: MeetingChecklistItem[]; PRIOR_TO_MEETING: MeetingChecklistItem[]; AFTER_MEETING: MeetingChecklistItem[] };
    rs: { NOI: MeetingChecklistItem[]; NOM: MeetingChecklistItem[]; PRIOR_TO_MEETING: MeetingChecklistItem[]; AFTER_MEETING: MeetingChecklistItem[] };
  };
  meetingVenues?: string[];
  disclosureStandardParagraph?: string;
  disclosureRemediationParagraph?: string;
  waterRateOptions?: string[];
  conflictRegisterTemplate?: string;
  meetingDateSettings?: { bc: MeetingDateSettings; rs: MeetingDateSettings };
  invoicePricingTiers?: InvoicePricingTier[];
}

export type ContractorCategory = string;
export type NotingMethod = 'Email' | 'Phone Call' | 'Online Submission';

export interface NotingRequirement {
  method: NotingMethod;
  detail: string;
}

export interface Contractor {
  id: string;
  name: string;
  category: ContractorCategory;
  contactPerson: string;
  email: string;
  phone: string;
  notingRequirements?: NotingRequirement[];
  notingInstructions?: string;
}

export enum ReminderType {
  INSURANCE = 'INSURANCE',
  INSURANCE_VALUATION = 'INSURANCE_VALUATION',
  BWOF = 'BWOF',
  AGM = 'AGM',
  LTMP = 'LTMP',
  FINANCIAL = 'FINANCIAL',
  COMPLIANCE = 'COMPLIANCE',
  UPCOMING_ACTION = 'UPCOMING_ACTION'
}

export interface Reminder {
  id: string;
  bcId: string;
  bcName: string;
  type: ReminderType;
  dueDate: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface TemplateFileRecord {
  name: string;
  data: string; // base64-encoded .docx content
  uploadedAt: string;
}

export interface ActionComment {
    id: string;
    reminderId: string;
    bcId: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: string;
    isDeleted: boolean;
}

export interface SnoozedAlert {
  id: string;
  reminderId: string;
  bcId: string;
  snoozedUntil: string;
  reason: string;
  snoozedByUserId: string;
  snoozedByUserName: string;
  snoozedAt: string;
}
