
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BodyCorporate, Reminder, ReminderType, User, Meeting, UserRole, Contractor, ActionComment } from '../types';

interface DataContextType {
  complexes: BodyCorporate[];
  reminders: Reminder[];
  managers: User[]; // Users eligible to be managers (admin | account_manager)
  users: User[];
  contractors: Contractor[];
  actionComments: ActionComment[];
  addComplex: (bc: BodyCorporate) => void;
  addComplexes: (bcs: BodyCorporate[]) => void;
  updateComplex: (bc: BodyCorporate) => void;
  toggleArchiveComplex: (id: string) => void;
  getComplex: (id: string) => BodyCorporate | undefined;
  assignManagerToComplex: (bcId: string, managerName: string) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  addMeeting: (bcId: string, meeting: Meeting) => void;
  updateMeeting: (bcId: string, meeting: Meeting) => void;
  deleteMeeting: (bcId: string, meetingId: string) => void;
  addContractor: (contractor: Contractor) => void;
  updateContractor: (contractor: Contractor) => void;
  deleteContractor: (id: string) => void;
  addActionComment: (reminderId: string, text: string, user: User) => void;
  removeActionComment: (commentId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Users
const INITIAL_USERS: User[] = [
  {
    id: '1',
    name: "Kareen Mackey",
    role: 'admin',
    title: "Director",
    qualifications: "BIT EMBA MInstD GC(Affiliated)",
    email: "kareen@prop101.co.nz",
    phone: "027 291 8811"
  },
  {
    id: '2',
    name: "Joanne Barreto",
    role: 'admin',
    title: "Director",
    qualifications: "BProp (Property)",
    email: "joanne@prop101.co.nz",
    phone: "021 495 911"
  },
  {
    id: '3',
    name: "Celia Iddon",
    role: 'account_manager',
    title: "Body Corporate Manager",
    email: "celia@prop101.co.nz",
    phone: "021 165 8067"
  },
  {
    id: '4',
    name: "Gary Cheung",
    role: 'account_manager',
    title: "Body Corporate Manager",
    email: "gary@prop101.co.nz",
    phone: "021 495 634"
  },
  {
    id: '5',
    name: "Laura Van Engelen",
    role: 'account_manager',
    title: "Body Corporate Manager",
    email: "laura@prop101.co.nz",
    phone: "021 338 681"
  },
  {
    id: '6',
    name: "Admin User",
    role: 'admin',
    email: "admin@prop101.co.nz",
    title: "Administrator"
  }
];

// Initial Contractors
const INITIAL_CONTRACTORS: Contractor[] = [
  {
    id: '1',
    name: 'Crombie Lockwood',
    category: 'Insurance Broker',
    contactPerson: 'Steve Jones',
    email: 'steve.jones@example.com',
    phone: '09 555 1234'
  },
  {
    id: '2',
    name: 'Aon New Zealand',
    category: 'Insurance Broker',
    contactPerson: 'Sarah Smith',
    email: 'sarah.smith@example.com',
    phone: '09 555 5678'
  },
  {
    id: '3',
    name: 'Telfer Young',
    category: 'Insurance Valuer',
    contactPerson: 'Mike Brown',
    email: 'mike@telferyoung.com',
    phone: '09 555 9999'
  },
  {
    id: '4',
    name: 'Prendos',
    category: 'Insurance Valuer',
    contactPerson: 'Jane Doe',
    email: 'jane@prendos.co.nz',
    phone: '09 555 1111'
  },
  {
    id: '5',
    name: 'Argest',
    category: 'Compliance',
    contactPerson: 'Dave Compliance',
    email: 'dave@argest.co.nz',
    phone: '09 555 2222'
  },
  {
    id: '6',
    name: 'Building Compliance Group',
    category: 'Compliance',
    contactPerson: 'Sarah Rules',
    email: 'sarah@bcg.co.nz',
    phone: '09 555 3333'
  }
];

const INITIAL_DATA: BodyCorporate[] = [
  {
    id: '1',
    bcNumber: 'BC123456',
    name: 'Harbour Views',
    address: '145 Quay Street, Auckland CBD',
    units: 45,
    type: 'Body Corporate',
    managerName: 'Kareen Mackey',
    managementFee: 12500,
    managementStartDate: '2020-01-01',
    onboardingType: 'Takeover',
    isArchived: false,
    financialYearEnd: '2025-03-31',
    meetings: [],
    previousAgmDate: '2024-06-20',
    nextAgmDate: '2025-06-20',
    nextAgmTime: '18:00',
    nextAgmVenue: 'Community Hall',
    nextAgmVenueAddress: '145 Quay Street, Ground Floor',
    noiDueDate: '2025-05-16', 
    insuranceExpiry: '2025-06-15',
    insuranceBroker: 'Crombie Lockwood',
    nextValuationDue: '2025-05-01',
    hasBwof: true,
    bwofExpiry: '2025-05-20',
    bwofConsultant: 'Argest',
    ltmpCompletedDate: '2022-01-15',
    nextLtmpRenewalDate: '2025-01-15',
    hasBuildingManager: true,
    buildingManagerCompany: 'City Services',
    buildingManagerName: 'John Smith',
    buildingManagerPhone: '021 123 4567',
    buildingManagerEmail: 'john@cityservices.co.nz'
  },
  {
    id: '2',
    bcNumber: 'BC 204096',
    name: 'Castle Glade',
    address: '8 Flynn Street, Birkdale, Auckland',
    units: 18,
    type: 'Body Corporate',
    managerName: 'Celia Iddon',
    managementFee: 8500,
    managementStartDate: '2021-06-01',
    onboardingType: 'New Development',
    isArchived: false,
    financialYearEnd: '2025-09-30',
    meetings: [
        {
            id: 'preload-mtg-1',
            type: 'AGM',
            date: '2026-01-31',
            time: '18:00',
            venue: 'Rawene Community Centre',
            venueAddress: '33 Rawene Road, Birkenhead, Auckland',
            noiDueDate: '2026-01-09',
            noiResponseDueDate: '2026-01-16'
        }
    ],
    nextAgmDate: '2026-01-31',
    nextAgmTime: '18:00',
    nextAgmVenue: 'Rawene Community Centre',
    nextAgmVenueAddress: '33 Rawene Road, Birkenhead, Auckland',
    noiDueDate: '2026-01-09',
    noiResponseDueDate: '2026-01-16',
    insuranceExpiry: '2025-11-01',
    hasBwof: true,
    bwofExpiry: '2025-10-15',
    hasBuildingManager: false
  },
  {
    id: '3',
    bcNumber: 'IS Upland',
    name: 'Upland Road',
    address: '12 Upland Road, Remuera, Auckland',
    units: 12,
    type: 'Incorporated Society',
    managerName: 'Gary Cheung',
    managementFee: 6000,
    managementStartDate: '2023-01-01',
    onboardingType: 'Takeover',
    isArchived: false,
    financialYearEnd: '2025-12-31',
    isocNomDaysPrior: 7,
    meetings: [
         {
            id: 'preload-mtg-upland',
            type: 'SGM',
            date: '2026-02-01',
            time: '10:00',
            venue: 'On Site',
            venueAddress: '12 Upland Road, Remuera',
        }
    ],
    nextAgmDate: '2026-02-01',
    insuranceExpiry: '2026-02-01',
    hasBwof: false
  }
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [complexes, setComplexes] = useState<BodyCorporate[]>(INITIAL_DATA);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [contractors, setContractors] = useState<Contractor[]>(INITIAL_CONTRACTORS);
  const [actionComments, setActionComments] = useState<ActionComment[]>([]);

  // Derived Managers: Only Admins and Account Managers can manage properties
  const managers = users.filter(u => u.role === 'admin' || u.role === 'account_manager');

  // Simulate calculating reminders based on dates
  useEffect(() => {
    const generatedReminders: Reminder[] = [];
    const today = new Date();
    // Reset time part for accurate date comparison
    today.setHours(0,0,0,0);
    
    // Only process active complexes
    complexes.filter(c => !c.isArchived).forEach(bc => {
      // 1. Insurance Expiry
      if (bc.insuranceExpiry) {
        const insDate = new Date(bc.insuranceExpiry);
        const diffTimeIns = insDate.getTime() - today.getTime();
        const diffDaysIns = Math.ceil(diffTimeIns / (1000 * 60 * 60 * 24));

        if (diffDaysIns < 0) {
            generatedReminders.push({
                id: `ins-exp-${bc.id}`,
                bcId: bc.id,
                bcName: bc.name,
                type: ReminderType.INSURANCE,
                dueDate: bc.insuranceExpiry,
                message: `URGENT: Insurance EXPIRED on ${bc.insuranceExpiry}`,
                severity: 'high'
            });
        } else if (diffDaysIns <= 90) {
            generatedReminders.push({
                id: `ins-${bc.id}`,
                bcId: bc.id,
                bcName: bc.name,
                type: ReminderType.INSURANCE,
                dueDate: bc.insuranceExpiry,
                message: `Insurance renewal due in ${diffDaysIns} days.`,
                severity: diffDaysIns < 30 ? 'high' : 'medium'
            });
        }
      }

      // 2. BWOF Expiry
      if (bc.hasBwof && bc.bwofExpiry) {
          const bwofDate = new Date(bc.bwofExpiry);
          const diffTimeBwof = bwofDate.getTime() - today.getTime();
          const diffDaysBwof = Math.ceil(diffTimeBwof / (1000 * 60 * 60 * 24));

          if (diffDaysBwof < 0) {
              generatedReminders.push({
                  id: `bwof-exp-${bc.id}`,
                  bcId: bc.id,
                  bcName: bc.name,
                  type: ReminderType.BWOF,
                  dueDate: bc.bwofExpiry,
                  message: `URGENT: BWOF EXPIRED on ${bc.bwofExpiry}`,
                  severity: 'high'
              });
          } else if (diffDaysBwof <= 30) {
              generatedReminders.push({
                  id: `bwof-${bc.id}`,
                  bcId: bc.id,
                  bcName: bc.name,
                  type: ReminderType.BWOF,
                  dueDate: bc.bwofExpiry,
                  message: `BWOF expires in ${diffDaysBwof} days.`,
                  severity: 'medium'
              });
          }
      }

      // 3. Meeting Critical Actions (NOI / NOM)
      if (bc.meetings && bc.meetings.length > 0) {
          bc.meetings.forEach(meeting => {
              const meetingDate = new Date(meeting.date);
              // Ignore past meetings, but keep today's meetings
              if (meetingDate < today) return; 
              
              const isIS = bc.type === 'Incorporated Society' || bc.bcNumber.startsWith('IS');
              
              // Calculate Deadlines
              const deadlines = { noi: null as Date | null, nom: null as Date | null };
              
              // NOI (AGM only, BC only) - 22 days prior
              if (meeting.type === 'AGM' && !isIS) {
                  const d = new Date(meetingDate);
                  d.setDate(d.getDate() - 22);
                  deadlines.noi = d;
              }

              // NOM (Agenda) - BC: 15 days, IS: Configurable/7 days
              const nomDays = isIS ? (bc.isocNomDaysPrior || 7) : 15;
              const dNom = new Date(meetingDate);
              dNom.setDate(dNom.getDate() - nomDays);
              deadlines.nom = dNom;

              // Check NOI
              if (deadlines.noi && !meeting.noiIssued) {
                  const diffTime = deadlines.noi.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  // If due within 7 days (or overdue)
                  if (diffDays <= 7) {
                      generatedReminders.push({
                          id: `noi-${bc.id}-${meeting.id}`,
                          bcId: bc.id,
                          bcName: bc.name,
                          type: ReminderType.AGM,
                          dueDate: deadlines.noi.toISOString().split('T')[0],
                          message: diffDays < 0 
                            ? `OVERDUE: NOI for ${meeting.type} was due on ${deadlines.noi.toLocaleDateString('en-NZ')}` 
                            : `Send NOI for ${meeting.type} (Due: ${deadlines.noi.toLocaleDateString('en-NZ')})`,
                          severity: diffDays <= 2 ? 'high' : 'medium'
                      });
                  }
              }

              // Check NOM
              if (deadlines.nom && !meeting.nomIssued) {
                  const diffTime = deadlines.nom.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  // If due within 7 days (or overdue)
                  if (diffDays <= 7) {
                      generatedReminders.push({
                          id: `nom-${bc.id}-${meeting.id}`,
                          bcId: bc.id,
                          bcName: bc.name,
                          type: ReminderType.AGM,
                          dueDate: deadlines.nom.toISOString().split('T')[0],
                          message: diffDays < 0 
                            ? `OVERDUE: NOM/Agenda for ${meeting.type} was due on ${deadlines.nom.toLocaleDateString('en-NZ')}` 
                            : `Send NOM/Agenda for ${meeting.type} (Due: ${deadlines.nom.toLocaleDateString('en-NZ')})`,
                          severity: diffDays <= 2 ? 'high' : 'medium'
                      });
                  }
              }
          });
      }
    });

    setReminders(generatedReminders);
  }, [complexes]);

  const addComplex = (bc: BodyCorporate) => {
    setComplexes(prev => [...prev, { ...bc, meetings: [], isArchived: false }]);
  };

  const addComplexes = (bcs: BodyCorporate[]) => {
    setComplexes(prev => [...prev, ...bcs.map(b => ({...b, meetings: [], isArchived: false}))]);
  };

  const updateComplex = (updatedBc: BodyCorporate) => {
    setComplexes(complexes.map(c => c.id === updatedBc.id ? updatedBc : c));
  };

  const toggleArchiveComplex = (id: string) => {
    setComplexes(prev => prev.map(c => c.id === id ? { ...c, isArchived: !c.isArchived } : c));
  };

  const getComplex = (id: string) => complexes.find(c => c.id === id);

  const assignManagerToComplex = (bcId: string, managerName: string) => {
    setComplexes(prev => prev.map(c => c.id === bcId ? { ...c, managerName } : c));
  };

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const updateUserRole = (userId: string, role: UserRole) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  };

  const syncAgmDetails = (meeting: Meeting) => {
      // Only sync if it's a future AGM or SGM that acts as AGM
      if ((meeting.type === 'AGM' || meeting.type === 'SGM') && new Date(meeting.date) > new Date()) {
          return {
              nextAgmDate: meeting.date,
              nextAgmTime: meeting.time,
              nextAgmVenue: meeting.venue,
              nextAgmVenueAddress: meeting.venueAddress,
              noiResponseDueDate: meeting.noiResponseDueDate,
              noiDueDate: meeting.noiDueDate
          };
      }
      return {};
  };

  const addMeeting = (bcId: string, meeting: Meeting) => {
      setComplexes(prev => prev.map(c => {
          if (c.id !== bcId) return c;
          
          const newMeetings = [...c.meetings, meeting].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const extraUpdates = syncAgmDetails(meeting);

          return {
              ...c,
              meetings: newMeetings,
              ...extraUpdates
          }
      }));
  }

  const updateMeeting = (bcId: string, updatedMeeting: Meeting) => {
      setComplexes(prev => prev.map(c => {
          if (c.id !== bcId) return c;
          
          const newMeetings = c.meetings.map(m => m.id === updatedMeeting.id ? updatedMeeting : m)
                                        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          const extraUpdates = syncAgmDetails(updatedMeeting);

          return {
              ...c,
              meetings: newMeetings,
              ...extraUpdates
          }
      }));
  };

  const deleteMeeting = (bcId: string, meetingId: string) => {
      setComplexes(prev => prev.map(c => {
          if (c.id !== bcId) return c;
          const updatedMeetings = c.meetings.filter(m => m.id !== meetingId);
          return {
              ...c,
              meetings: updatedMeetings
          };
      }));
  };

  // Contractor CRUD
  const addContractor = (contractor: Contractor) => {
    setContractors(prev => [...prev, contractor]);
  };

  const updateContractor = (contractor: Contractor) => {
    setContractors(prev => prev.map(c => c.id === contractor.id ? contractor : c));
  };

  const deleteContractor = (id: string) => {
    setContractors(prev => prev.filter(c => c.id !== id));
  };

  // Action Comments
  const addActionComment = (reminderId: string, text: string, user: User) => {
      const newComment: ActionComment = {
          id: Math.random().toString(36).substr(2, 9),
          reminderId,
          userId: user.id,
          userName: user.name,
          text,
          timestamp: new Date().toISOString(),
          isDeleted: false
      };
      setActionComments(prev => [...prev, newComment]);
  };

  const removeActionComment = (commentId: string) => {
      // Soft delete for audit purposes
      setActionComments(prev => prev.map(c => c.id === commentId ? { ...c, isDeleted: true } : c));
  };

  return (
    <DataContext.Provider value={{ 
        complexes, reminders, managers, users, contractors, actionComments,
        addComplex, addComplexes, updateComplex, toggleArchiveComplex, getComplex, assignManagerToComplex, 
        addUser, updateUser, updateUserRole, 
        addMeeting, updateMeeting, deleteMeeting,
        addContractor, updateContractor, deleteContractor,
        addActionComment, removeActionComment
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};
