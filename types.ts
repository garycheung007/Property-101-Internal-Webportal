
export interface Meeting {
  id: string;
  type: 'AGM' | 'EGM' | 'SGM' | 'Committee';
  date: string;
  time: string;
  venue: string;
  venueAddress?: string;
  
  // Specific to AGM
  noiDueDate?: string; // Calculated 
  noiResponseDueDate?: string;
  agendaSentDate?: string;
  minutesSentDate?: string;

  // Document Tracking
  noiIssued?: boolean;
  nomIssued?: boolean;
  minutesIssued?: boolean;
}

export type ComplexType = 'Body Corporate' | 'Incorporated Society';
export type OnboardingType = 'New Development' | 'Takeover';

export interface BodyCorporate {
  id: string;
  bcNumber: string; // Unique Identifier: "BC123456" or "IS 365 Main Road"
  name: string;
  address: string;
  units: number;
  
  // Management Details
  type?: ComplexType;
  managerName: string;
  managementFee: number;
  managementStartDate?: string;
  onboardingType?: OnboardingType;
  isArchived?: boolean;

  financialYearEnd: string; // MM-DD or YYYY-MM-DD

  // Incorporated Society Configuration
  isocNomDaysPrior?: number; // Defaults to 7 if undefined

  // Meetings History
  meetings: Meeting[];

  // AGM Management (Legacy fields for Dashboard compatibility, synced with latest AGM)
  previousAgmDate?: string;
  nextAgmDate?: string;
  nextAgmTime?: string;
  nextAgmVenue?: string;
  nextAgmVenueAddress?: string;
  noiDueDate?: string; // 1st Notice
  noiResponseDueDate?: string;
  noiResponseDueTime?: string;
  motionsDueBy?: string;
  nomDueDate?: string; // 2nd Notice (Agenda)
  pollsDone?: boolean;
  postMeetingDocsDone?: boolean;
  minutesSent?: boolean;

  // Insurance
  insuranceExpiry: string; // ISO Date
  insuranceBroker?: string;
  insuranceUnderwriter?: string;
  lastInsuranceValuationDate?: string;
  lastInsuranceValuer?: string; // Historical record
  insuranceValuer?: string; // Current Assigned Valuer (Contractor)
  nextValuationDue?: string; // 3 Months prior
  insuranceQuestionnaire?: string; // Status or Link
  insuranceNote?: string;

  // Compliance (BWOF)
  hasBwof?: boolean;
  bwofExpiry?: string;
  bwofConsultant?: string; // Contractor Name
  complianceCompany?: string; // Legacy field, mapped to bwofConsultant logic where applicable
  complianceContactEmail?: string;
  bwofNote?: string;

  // Maintenance (LTMP)
  hasLtmp?: boolean; // Specifically for ISOC to toggle existence
  ltmpCompletedDate?: string;
  ltmpCompletedBy?: string; // Contractor Name
  nextLtmpRenewalDate?: string; // Calculated 3 years from completed

  // Health & Safety
  hasHsReport?: boolean;
  hsReportDate?: string;
  hsReportBy?: string; // Contractor Name

  // Building Manager
  hasBuildingManager?: boolean;
  buildingManagerCompany?: string;
  buildingManagerName?: string;
  buildingManagerPhone?: string;
  buildingManagerEmail?: string;
  
  // Incorporated Society Specific
  isocRegistrationType?: '1908' | '2022';
  isocReRegistrationNote?: string;

  // Debt Collection
  lastDebtCollectionDate?: string;
  debtCollectionNote?: string;
}

export type UserRole = 'admin' | 'account_manager' | 'support';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  // Details for Signature / Contact
  title?: string; // Position
  phone?: string;
  qualifications?: string;
  signatureUrl?: string; // Base64 Data URI
}

export type ContractorCategory = 'Insurance Broker' | 'Insurance Valuer' | 'Consultant' | 'General' | 'Compliance';

export interface Contractor {
  id: string;
  name: string;
  category: ContractorCategory;
  contactPerson: string;
  email: string;
  phone: string;
}

export enum ReminderType {
  INSURANCE = 'INSURANCE',
  INSURANCE_VALUATION = 'INSURANCE_VALUATION',
  BWOF = 'BWOF',
  AGM = 'AGM',
  LTMP = 'LTMP',
  FINANCIAL = 'FINANCIAL'
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

export interface ActionComment {
    id: string;
    reminderId: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: string; // ISO Date String
    isDeleted: boolean;
}