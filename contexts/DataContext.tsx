
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  collection, onSnapshot, doc, addDoc, deleteDoc, setDoc,
  writeBatch, collectionGroup
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
  BodyCorporate, Reminder, User, Meeting, UserRole,
  Contractor, ActionComment, SystemSettings, SnoozedAlert
} from '../types';
import {
  DEFAULT_CATEGORIES, DEFAULT_INSURANCE_SETTINGS,
  DEFAULT_MEETING_CHECKLIST, DEFAULT_BWOF_MESSAGE
} from '../constants/defaults';
import { DEFAULT_TEMPLATES, DEFAULT_CONFLICT_REGISTER_TEMPLATE, CHAIRPERSON_TABLE_HTML, COMMITTEE_TABLE_HTML } from '../constants/defaultTemplates';
import { generateReminders } from '../utils/generateReminders';

interface DataContextType {
  complexes: BodyCorporate[];
  reminders: Reminder[];
  managers: User[];
  users: User[];
  contractors: Contractor[];
  actionComments: ActionComment[];
  systemSettings: SystemSettings;
  loading: boolean;
  syncError: string | null;
  addComplex: (bc: BodyCorporate) => Promise<void>;
  addComplexes: (bcs: BodyCorporate[]) => Promise<void>;
  updateComplex: (bc: BodyCorporate) => Promise<void>;
  toggleArchiveComplex: (id: string) => Promise<void>;
  getComplex: (id: string) => BodyCorporate | undefined;
  assignManagerToComplex: (bcId: string, managerName: string) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  addMeeting: (bcId: string, meeting: Meeting) => Promise<void>;
  updateMeeting: (bcId: string, meeting: Meeting) => Promise<void>;
  deleteMeeting: (bcId: string, meetingId: string) => Promise<void>;
  addContractor: (contractor: Contractor) => Promise<void>;
  addContractors: (contractors: Contractor[]) => Promise<void>;
  updateContractor: (contractor: Contractor) => Promise<void>;
  deleteContractor: (id: string) => Promise<void>;
  snoozedAlerts: SnoozedAlert[];
  snoozeAlert: (reminderId: string, bcId: string, days: number, reason: string, user: User) => Promise<void>;
  unsnoozeAlert: (reminderId: string) => Promise<void>;
  addActionComment: (reminderId: string, bcId: string, text: string, user: User) => Promise<void>;
  removeActionComment: (commentId: string) => Promise<void>;
  updateSystemSettings: (settings: SystemSettings) => Promise<void>;
  restoreData: (data: any) => Promise<void>;
  bulkUpdateComplexes: (updates: Array<{ id: string } & Partial<BodyCorporate>>) => Promise<void>;
  initializeDummyData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const cleanData = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(item => cleanData(item));
  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined && key !== 'meetings') newObj[key] = cleanData(obj[key]);
    });
    return newObj;
  }
  return obj;
};

const migrateSettings = (data: SystemSettings): SystemSettings => {
  if (!data.contractorCategories) data.contractorCategories = DEFAULT_CATEGORIES;
  {
    const tpl = data.meetingChecklistTemplates as any;
    if (!tpl) {
      data.meetingChecklistTemplates = DEFAULT_MEETING_CHECKLIST;
    } else if ('NOI' in tpl && !('bc' in tpl)) {
      // Migrate old flat format — preserve existing BC items, seed RS with defaults
      data.meetingChecklistTemplates = {
        bc: { NOI: tpl.NOI || [], NOM: tpl.NOM || [], PRIOR_TO_MEETING: tpl.PRIOR_TO_MEETING || [], AFTER_MEETING: tpl.AFTER_MEETING || [] },
        rs: DEFAULT_MEETING_CHECKLIST.rs,
      };
    }
  }
  if (!data.bwofConfirmationMessage) data.bwofConfirmationMessage = DEFAULT_BWOF_MESSAGE;
  if (!data.documentTemplates) data.documentTemplates = DEFAULT_TEMPLATES;
  if (!data.conflictRegisterTemplate) data.conflictRegisterTemplate = DEFAULT_CONFLICT_REGISTER_TEMPLATE;
  if (data.paragraphSpacing === undefined) data.paragraphSpacing = 10;

  if (data.documentTemplates) {
    const templateKeys = ['noiLetter', 'responseForm', 'noiLetterBC', 'responseFormBC', 'noiLetterISOC', 'responseFormISOC', 's146', 's147', 'cpl'];
    const tpl = data.documentTemplates as unknown as Record<string, string | undefined>;
    templateKeys.forEach(key => {
      if (tpl[key]) {
        if (!tpl[key]!.includes('{{header}}')) tpl[key] = '{{header}}\n' + tpl[key];
        if (!tpl[key]!.includes('{{footer}}')) tpl[key] = tpl[key] + '\n{{footer}}';
      }
    });

    if (!data.documentTemplates.noiLetterBC && data.documentTemplates.noiLetter)
      data.documentTemplates.noiLetterBC = data.documentTemplates.noiLetter;
    if (!data.documentTemplates.responseFormBC && data.documentTemplates.responseForm)
      data.documentTemplates.responseFormBC = data.documentTemplates.responseForm;
    if (!data.documentTemplates.noiLetterISOC)
      data.documentTemplates.noiLetterISOC = DEFAULT_TEMPLATES.noiLetterISOC;
    if (!data.documentTemplates.responseFormISOC)
      data.documentTemplates.responseFormISOC = DEFAULT_TEMPLATES.responseFormISOC;
    if (!data.documentTemplates.noiLetter && data.documentTemplates.noiLetterBC)
      data.documentTemplates.noiLetter = data.documentTemplates.noiLetterBC;
    if (!data.documentTemplates.responseForm && data.documentTemplates.responseFormBC)
      data.documentTemplates.responseForm = data.documentTemplates.responseFormBC;

    if (data.documentTemplates.responseFormBC) {
      let rf = data.documentTemplates.responseFormBC;
      if (rf.includes('{{chairperson_table}}')) rf = rf.replace('{{chairperson_table}}', CHAIRPERSON_TABLE_HTML);
      if (rf.includes('{{committee_table}}')) rf = rf.replace('{{committee_table}}', COMMITTEE_TABLE_HTML);
      data.documentTemplates.responseFormBC = rf;
    }

    if (data.documentTemplates.noiLetter && !data.documentTemplates.noiLetter.includes('The Proprietors')) {
      const headerBlock = `<p>{{current_date}}</p>
<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: none; margin-bottom: 15pt;">
  <tr><td style="border: none; padding: 0;">
    <p style="margin-bottom: 0pt; mso-margin-bottom-alt: 0pt;">The Proprietors<br/>Body Corporate {{bc_number}}<br/>{{address}}</p>
  </td></tr>
</table>`;
      data.documentTemplates.noiLetter = headerBlock + data.documentTemplates.noiLetter;
    }

    if (!data.documentTemplates.s146) data.documentTemplates.s146 = DEFAULT_TEMPLATES.s146;
    if (!data.documentTemplates.s147) data.documentTemplates.s147 = DEFAULT_TEMPLATES.s147;
    if (!data.documentTemplates.cpl)  data.documentTemplates.cpl  = DEFAULT_TEMPLATES.cpl;
  }

  if (data.insuranceSettings?.workflowSteps) {
    data.insuranceSettings.workflowSteps = data.insuranceSettings.workflowSteps.map((step, idx) => ({
      ...step, id: step.id || `wf_auto_${idx}`
    }));
  }

  return data;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [baseComplexes, setBaseComplexes] = useState<BodyCorporate[]>([]);
  const [allMeetings, setAllMeetings] = useState<Record<string, Meeting[]>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [actionComments, setActionComments] = useState<ActionComment[]>([]);
  const [snoozedAlerts, setSnoozedAlerts] = useState<SnoozedAlert[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const complexes = useMemo(() => (
    baseComplexes.map(bc => ({ ...bc, meetings: allMeetings[bc.id] || [] }))
  ), [baseComplexes, allMeetings]);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }

    const unsubComplexes = onSnapshot(collection(db, 'complexes'),
      snapshot => { setBaseComplexes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BodyCorporate))); setLoading(false); },
      error => setSyncError(error.message)
    );

    const unsubMeetings = onSnapshot(collectionGroup(db, 'meetings'), snapshot => {
      const map: Record<string, Meeting[]> = {};
      snapshot.docs.forEach(d => {
        const bcId = d.ref.parent.parent?.id;
        if (bcId) { if (!map[bcId]) map[bcId] = []; map[bcId].push({ id: d.id, ...d.data() } as Meeting); }
      });
      setAllMeetings(map);
    });

    const unsubUsers       = onSnapshot(collection(db, 'users'),       s => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() } as User))));
    const unsubContractors = onSnapshot(collection(db, 'contractors'),  s => setContractors(s.docs.map(d => ({ id: d.id, ...d.data() } as Contractor))));
    const unsubComments    = onSnapshot(collection(db, 'comments'),       s => setActionComments(s.docs.map(d => ({ id: d.id, ...d.data() } as ActionComment))));
    const unsubSnoozed     = onSnapshot(collection(db, 'snoozed_alerts'), s => setSnoozedAlerts(s.docs.map(d => ({ id: d.id, ...d.data() } as SnoozedAlert))));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), docSnap => {
      if (docSnap.exists()) {
        setSystemSettings(migrateSettings(docSnap.data() as SystemSettings));
      } else {
        setSystemSettings({
          contractorCategories: DEFAULT_CATEGORIES,
          insuranceSettings: DEFAULT_INSURANCE_SETTINGS,
          meetingChecklistTemplates: DEFAULT_MEETING_CHECKLIST,
          bwofConfirmationMessage: DEFAULT_BWOF_MESSAGE,
          documentTemplates: DEFAULT_TEMPLATES,
          paragraphSpacing: 10
        });
      }
    });

    return () => { unsubComplexes(); unsubMeetings(); unsubUsers(); unsubContractors(); unsubComments(); unsubSnoozed(); unsubSettings(); };
  }, [isAuthenticated]);

  const reminders = useMemo(() => (
    generateReminders(complexes, systemSettings.insuranceSettings || DEFAULT_INSURANCE_SETTINGS, systemSettings.meetingChecklistTemplates, systemSettings.meetingDateSettings)
  ), [complexes, systemSettings]);

  const managers = users.filter(u => u.role === 'admin' || u.role === 'account_manager');

  const addComplex = async (bc: BodyCorporate) => {
    const bcId = bc.id || `bc_${Date.now()}`;
    await setDoc(doc(db, 'complexes', bcId), cleanData({ ...bc, id: bcId, isArchived: false }), { merge: true });
  };
  const addComplexes = async (bcs: BodyCorporate[]) => {
    const batch = writeBatch(db);
    bcs.forEach(bc => batch.set(doc(db, 'complexes', bc.id), cleanData({ ...bc, isArchived: false }), { merge: true }));
    await batch.commit();
  };
  const updateComplex       = async (bc: BodyCorporate) => setDoc(doc(db, 'complexes', bc.id), cleanData(bc), { merge: true });
  const toggleArchiveComplex = async (id: string) => {
    const bc = complexes.find(c => c.id === id);
    if (bc) await setDoc(doc(db, 'complexes', id), { isArchived: !bc.isArchived }, { merge: true });
  };
  const getComplex = (id: string) => complexes.find(c => c.id === id);
  const assignManagerToComplex = async (bcId: string, managerName: string) =>
    setDoc(doc(db, 'complexes', bcId), { managerName }, { merge: true });

  const addUser        = async (user: User)       => setDoc(doc(db, 'users', user.id), cleanData(user), { merge: true });
  const updateUser     = async (user: User)       => setDoc(doc(db, 'users', user.id), cleanData(user), { merge: true });
  const deleteUser     = async (userId: string)   => deleteDoc(doc(db, 'users', userId));
  const updateUserRole = async (userId: string, role: UserRole) => setDoc(doc(db, 'users', userId), { role }, { merge: true });

  const addMeeting = async (bcId: string, meeting: Meeting) => {
    const meetingId = meeting.id || `mtg_${Date.now()}`;
    await setDoc(doc(db, 'complexes', bcId, 'meetings', meetingId), cleanData({ ...meeting, id: meetingId }));
  };
  const updateMeeting = async (bcId: string, m: Meeting) =>
    setDoc(doc(db, 'complexes', bcId, 'meetings', m.id), cleanData(m), { merge: true });
  const deleteMeeting = async (bcId: string, meetingId: string) =>
    deleteDoc(doc(db, 'complexes', bcId, 'meetings', meetingId));

  const addContractor    = async (c: Contractor) => setDoc(doc(db, 'contractors', c.id), cleanData(c), { merge: true });
  const addContractors   = async (cs: Contractor[]) => {
    const batch = writeBatch(db);
    cs.forEach(c => batch.set(doc(db, 'contractors', c.id), cleanData(c), { merge: true }));
    await batch.commit();
  };
  const updateContractor = async (c: Contractor) => setDoc(doc(db, 'contractors', c.id), cleanData(c), { merge: true });
  const deleteContractor = async (id: string)    => deleteDoc(doc(db, 'contractors', id));

  const addActionComment    = async (reminderId: string, bcId: string, text: string, user: User): Promise<void> => {
    await addDoc(collection(db, 'comments'), cleanData({ reminderId, bcId, userId: user.id, userName: user.name, text, timestamp: new Date().toISOString(), isDeleted: false }));
  };
  const removeActionComment = async (commentId: string) =>
    setDoc(doc(db, 'comments', commentId), { isDeleted: true }, { merge: true });
  const snoozeAlert = async (reminderId: string, bcId: string, days: number, reason: string, snoozeUser: User): Promise<void> => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    const snoozedUntil = until.toISOString().split('T')[0];
    const snoozeDocId = `snooze_${reminderId.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await setDoc(doc(db, 'snoozed_alerts', snoozeDocId), cleanData({ reminderId, bcId, snoozedUntil, reason, snoozedByUserId: snoozeUser.id, snoozedByUserName: snoozeUser.name, snoozedAt: new Date().toISOString() }));
    await addDoc(collection(db, 'comments'), cleanData({ reminderId, bcId, userId: snoozeUser.id, userName: snoozeUser.name, text: `Snoozed ${days} day${days !== 1 ? 's' : ''} — ${reason} (alert returns ${until.toLocaleDateString('en-NZ')})`, timestamp: new Date().toISOString(), isDeleted: false }));
  };
  const unsnoozeAlert = async (reminderId: string): Promise<void> => {
    const snoozeDocId = `snooze_${reminderId.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await deleteDoc(doc(db, 'snoozed_alerts', snoozeDocId));
  };
  const updateSystemSettings = async (settings: SystemSettings) =>
    setDoc(doc(db, 'settings', 'global'), cleanData(settings), { merge: true });

  const bulkUpdateComplexes = async (updates: Array<{ id: string } & Partial<BodyCorporate>>) => {
    const BATCH_SIZE = 400;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      updates.slice(i, i + BATCH_SIZE).forEach(({ id, ...fields }) => {
        batch.set(doc(db, 'complexes', id), cleanData(fields), { merge: true });
      });
      await batch.commit();
    }
  };

  const restoreData = async (data: any) => {
    const batch = writeBatch(db);
    if (data.complexes)      data.complexes.forEach((bc: any)   => batch.set(doc(db, 'complexes',   bc.id), cleanData(bc),  { merge: true }));
    if (data.users)          data.users.forEach((u: any)         => batch.set(doc(db, 'users',       u.id),  cleanData(u),   { merge: true }));
    if (data.contractors)    data.contractors.forEach((c: any)   => batch.set(doc(db, 'contractors', c.id),  cleanData(c),   { merge: true }));
    if (data.systemSettings) batch.set(doc(db, 'settings', 'global'), cleanData(data.systemSettings), { merge: true });
    await batch.commit();
  };

  const initializeDummyData = async () => {
    const batch = writeBatch(db);
    const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];
    const complexId = 'k1';
    batch.set(doc(db, 'complexes', complexId), {
      id: complexId, bcNumber: '100101', name: 'Skyline Apartments',
      address: '123 Queen Street, Auckland CBD', units: 45, managerName: 'Kareen Mackey',
      type: 'Body Corporate', insuranceExpiry: nextMonthStr, lastInsuranceValuationDate: '2021-01-15',
      managementFee: 12500, financialYearStart: '1 April', financialYearEnd: '31 March',
      hasBwof: true, insuranceBroker: 'Crombie Lockwood'
    });
    batch.set(doc(db, 'complexes', complexId, 'meetings', 'm1'), { id: 'm1', type: 'AGM', date: nextMonthStr, time: '10:00', venue: 'Onsite' });
    batch.set(doc(db, 'settings', 'global'), {
      insuranceSettings: DEFAULT_INSURANCE_SETTINGS, contractorCategories: DEFAULT_CATEGORIES,
      meetingChecklistTemplates: DEFAULT_MEETING_CHECKLIST, bwofConfirmationMessage: DEFAULT_BWOF_MESSAGE,
      documentTemplates: DEFAULT_TEMPLATES, paragraphSpacing: 10
    });
    await batch.commit();
    console.log('Demo data initialized.');
  };

  return (
    <DataContext.Provider value={{
      complexes, reminders, managers, users, contractors, actionComments, snoozedAlerts, systemSettings, loading, syncError,
      addComplex, addComplexes, updateComplex, toggleArchiveComplex, getComplex, assignManagerToComplex,
      addUser, updateUser, deleteUser, updateUserRole, addMeeting, updateMeeting, deleteMeeting,
      addContractor, addContractors, updateContractor, deleteContractor,
      addActionComment, removeActionComment, snoozeAlert, unsnoozeAlert, updateSystemSettings, restoreData, bulkUpdateComplexes, initializeDummyData
    }}>{children}</DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};
