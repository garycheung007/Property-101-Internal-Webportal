import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Calendar, FileCheck, DollarSign, Clock, MessageCircle, Send, Trash2, X, History, Filter, User, CheckCircle2, ClipboardList, ArrowRightCircle, ExternalLink, ChevronRight, ChevronDown, ChevronUp, BellOff } from 'lucide-react';
import { Reminder, ReminderType } from '../types';
import { DEFAULT_MEETING_CHECKLIST, DEFAULT_MEETING_DATE_SETTINGS } from '../constants/defaults';

type DashboardCat = 'MEETING' | 'COMPLIANCE' | 'INSURANCE' | 'DEBT' | 'OTHER';
const ALL_CATS: DashboardCat[] = ['MEETING', 'COMPLIANCE', 'INSURANCE', 'DEBT', 'OTHER'];

const subtractWorkingDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() - 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) remaining--;
  }
  return result;
};

const Dashboard: React.FC = () => {
  const { complexes, reminders, actionComments, addActionComment, removeActionComment, snoozedAlerts, snoozeAlert, unsnoozeAlert, managers, updateComplex, updateMeeting, systemSettings } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const upcomingActionsRef = useRef<HTMLDivElement>(null);
  const criticalAlertsRef = useRef<HTMLDivElement>(null);
  const hasInitializedFilter = useRef(false);
  const hasInitializedSections = useRef(false);

  const [selectedManager, setSelectedManager] = useState<string>('all');
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [snoozeTarget, setSnoozeTarget] = useState<Reminder | null>(null);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [showSnoozedActions, setShowSnoozedActions] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [snoozeGroupItems, setSnoozeGroupItems] = useState<Reminder[]>([]);

  useEffect(() => {
    if (!hasInitializedFilter.current && complexes.length > 0 && user) {
      const hasOwnComplexes = complexes.some(c => !c.isArchived && c.managerName === user.name);
      if (hasOwnComplexes) setSelectedManager(user.name);
      hasInitializedFilter.current = true;
    }
  }, [complexes, user]);

  useEffect(() => {
    if (hasInitializedSections.current || reminders.length === 0) return;
    hasInitializedSections.current = true;
    const toOpen = new Set<string>(reminders
      .filter(r => r.type !== ReminderType.UPCOMING_ACTION && r.type !== ReminderType.LEVY)
      .map(r => {
        if (r.type === ReminderType.INSURANCE || r.type === ReminderType.INSURANCE_VALUATION) return 'INSURANCE';
        if (r.type === ReminderType.BWOF || r.type === ReminderType.COMPLIANCE) return 'COMPLIANCE';
        if (r.type === ReminderType.AGM || r.message.includes('NOI') || r.message.includes('NOM') || r.message.toLowerCase().includes('notice') || r.message.toLowerCase().includes('minutes')) return 'MEETING';
        return 'OTHER';
      })
    );
    setOpenSections(toOpen);
  }, [reminders]);

  const activeComplexes = complexes.filter(c => !c.isArchived);

  const filteredComplexes = selectedManager === 'all' 
    ? activeComplexes 
    : activeComplexes.filter(c => c.managerName === selectedManager);

  const filteredReminders = reminders.filter(r => {
      const complex = complexes.find(c => c.id === r.bcId);
      if (selectedManager === 'all') return true;
      return complex?.managerName === selectedManager;
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const activeSnoozedIds = new Set(
    snoozedAlerts.filter(s => new Date(s.snoozedUntil) >= today).map(s => s.reminderId)
  );
  const criticalAlerts = filteredReminders.filter(r => r.type !== ReminderType.UPCOMING_ACTION && r.type !== ReminderType.LEVY && !activeSnoozedIds.has(r.id));
  const snoozedCriticalAlerts = filteredReminders.filter(r => r.type !== ReminderType.UPCOMING_ACTION && r.type !== ReminderType.LEVY && activeSnoozedIds.has(r.id));
  const upcomingActions = filteredReminders.filter(r => r.type === ReminderType.UPCOMING_ACTION && !activeSnoozedIds.has(r.id));
  const snoozedUpcomingActions = filteredReminders.filter(r => r.type === ReminderType.UPCOMING_ACTION && activeSnoozedIds.has(r.id));
  const levyReminders = filteredReminders.filter(r => r.type === ReminderType.LEVY);

  const upcomingMeetings = filteredComplexes
    .flatMap(c => {
        const todayMs = new Date(new Date().setHours(0,0,0,0));
        const typeKey = c.type === 'Incorporated Society' ? 'rs' : 'bc';
        const sysDefault = systemSettings.meetingDateSettings?.[typeKey] || DEFAULT_MEETING_DATE_SETTINGS[typeKey];
        const mds = { ...sysDefault, ...c.meetingDateSettings };
        const results: any[] = [];

        const nextMtg = (c.meetings || [])
            .filter(m => m.type !== 'Committee' && new Date(m.date) >= todayMs)
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

        if (nextMtg) {
            results.push({
                id: nextMtg.id,
                type: nextMtg.type,
                date: nextMtg.date,
                time: nextMtg.time || 'TBC',
                bcNumber: c.bcNumber,
                bcName: c.name,
                bcId: c.id,
                noiIssued: nextMtg.noiIssued,
                nomIssued: nextMtg.nomIssued,
                noiDueDate: nextMtg.noiDueDate,
                noiResponseDueDate: nextMtg.noiResponseDueDate,
                noiResponseDueTime: nextMtg.noiResponseDueTime,
                complexType: c.type,
                nomDaysPrior: c.isocNomDaysPrior,
                noiNotApplicable: nextMtg.noiNotApplicable,
                minutesIssued: nextMtg.minutesIssued,
                noiIssuedDate: nextMtg.noiIssuedDate,
                nomIssuedDate: nextMtg.nomIssuedDate,
                minutesIssuedDate: nextMtg.minutesIssuedDate,
                minutesPrefDays: mds.minutesPreferDays,
                minutesDeadDays: mds.minutesDeadlineDays,
                isPastMeeting: false,
            });
        }

        (c.meetings || [])
            .filter(m => m.type !== 'Committee' && new Date(m.date) < todayMs && !m.minutesIssued)
            .forEach(m => {
                results.push({
                    id: m.id,
                    type: m.type,
                    date: m.date,
                    time: m.time || 'TBC',
                    bcNumber: c.bcNumber,
                    bcName: c.name,
                    bcId: c.id,
                    complexType: c.type,
                    minutesIssued: m.minutesIssued,
                    noiIssuedDate: m.noiIssuedDate,
                    nomIssuedDate: m.nomIssuedDate,
                    minutesIssuedDate: m.minutesIssuedDate,
                    minutesPrefDays: mds.minutesPreferDays,
                    minutesDeadDays: mds.minutesDeadlineDays,
                    isPastMeeting: true,
                });
            });

        return results;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 15);

  const totalUnits = filteredComplexes.reduce((sum, c) => sum + c.units, 0);
  const currentYear = today.getFullYear();
  const agmsRemainingThisYear = filteredComplexes.reduce((count, c) =>
    count + (c.meetings || []).filter(m =>
      m.type === 'AGM' && new Date(m.date) >= today && new Date(m.date).getFullYear() === currentYear
    ).length, 0);

  const meetingChecklistItems = filteredComplexes.flatMap(c => {
    const tplKey = c.type === 'Incorporated Society' ? 'rs' : 'bc';
    const meetingChecklistTemplates = systemSettings.meetingChecklistTemplates?.[tplKey] || DEFAULT_MEETING_CHECKLIST[tplKey];
    return (c.meetings || []).flatMap(meeting => {
      const mtgDate = new Date(meeting.date);
      if (isNaN(mtgDate.getTime())) return [];
      const isFuture = mtgDate >= today;
      const noiDone = meeting.noiIssued || meeting.noiNotApplicable;
      const progress = meeting.checklistProgress || {};
      const items: any[] = [];

      if (isFuture && noiDone && meeting.nomIssued && !meeting.minutesIssued) {
        const priorDue = subtractWorkingDays(mtgDate, 2);
        (meetingChecklistTemplates.PRIOR_TO_MEETING || [])
          .filter(item => !progress[item.id] && !item.dueDaysBeforeMeeting)
          .forEach(item => items.push({
            key: `ptm-${meeting.id}-${item.id}`,
            bcId: c.id, bcName: c.name,
            meetingId: meeting.id, meetingDate: meeting.date, meetingType: meeting.type,
            stage: 'PRIOR_TO_MEETING',
            item,
            dueDate: priorDue.toISOString().split('T')[0]
          }));
      }

      if (!isFuture && !meeting.minutesIssued) {
        (meetingChecklistTemplates.AFTER_MEETING || [])
          .filter(item => !progress[item.id] && !item.dueDaysBeforeMeeting)
          .forEach(item => items.push({
            key: `am-${meeting.id}-${item.id}`,
            bcId: c.id, bcName: c.name,
            meetingId: meeting.id, meetingDate: meeting.date, meetingType: meeting.type,
            stage: 'AFTER_MEETING',
            item,
            dueDate: meeting.date
          }));
      }

      return items;
    });
  }
  );

  const getCatForAlert = (type: ReminderType, message: string): DashboardCat => {
    if (type === ReminderType.INSURANCE || type === ReminderType.INSURANCE_VALUATION) return 'INSURANCE';
    if (type === ReminderType.BWOF || type === ReminderType.COMPLIANCE) return 'COMPLIANCE';
    if (type === ReminderType.AGM || message.includes('NOI') || message.includes('NOM') || message.toLowerCase().includes('notice') || message.toLowerCase().includes('minutes')) return 'MEETING';
    return 'OTHER';
  };

  const getCatForAction = (message: string): DashboardCat => {
    const prefix = message.match(/^([A-Z][A-Z\s&]+):/);
    if (prefix) {
      const p = prefix[1].trim();
      if (p === 'INSURANCE' || p.includes('VALUATION')) return 'INSURANCE';
      if (p === 'MEETING' || p.includes('NOI') || p.includes('NOM')) return 'MEETING';
      if (p === 'COMPLIANCE' || p.includes('BWOF')) return 'COMPLIANCE';
      if (p.includes('DEBT') || p.includes('LEVY')) return 'DEBT';
    }
    if (message.toLowerCase().includes('insurance') || message.toLowerCase().includes('valuation')) return 'INSURANCE';
    if (message.includes('NOI') || message.includes('NOM') || message.toLowerCase().includes('notice') || message.toLowerCase().includes('minutes')) return 'MEETING';
    if (message.toLowerCase().includes('bwof') || message.toLowerCase().includes('compliance')) return 'COMPLIANCE';
    return 'OTHER';
  };

  const getDueChip = (dueDate: string) => {
    const due = new Date(dueDate + 'T00:00:00');
    const todayMs = new Date(); todayMs.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - todayMs.getTime()) / 86400000);
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, cls: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50' };
    if (diffDays === 0) return { label: 'Due today', cls: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50' };
    if (diffDays <= 7) return { label: `${diffDays}d`, cls: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50' };
    return { label: new Date(dueDate + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }), cls: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' };
  };

  const categorySections = ALL_CATS.map(cat => {
    const catAlerts = criticalAlerts.filter(r => getCatForAlert(r.type, r.message) === cat);
    const catActions = cat === 'DEBT'
      ? levyReminders
      : upcomingActions.filter(r => getCatForAction(r.message) === cat);
    const catChecklist = cat === 'MEETING' ? meetingChecklistItems : [];
    return { cat, alerts: catAlerts, actions: catActions, checklistItems: catChecklist };
  }).filter(s => s.alerts.length > 0 || s.actions.length > 0 || s.checklistItems.length > 0);

  const CAT_CONFIG: Record<DashboardCat, { label: string; icon: React.ReactNode; bgColor: string; textColor: string; borderColor: string }> = {
    MEETING:    { label: 'Meetings',        icon: <Calendar size={15} />,      bgColor: 'bg-blue-50 dark:bg-blue-900/20',       textColor: 'text-blue-600 dark:text-blue-400',       borderColor: '#3B82F6' },
    COMPLIANCE: { label: 'Compliance',      icon: <FileCheck size={15} />,     bgColor: 'bg-amber-50 dark:bg-amber-900/20',     textColor: 'text-amber-600 dark:text-amber-400',     borderColor: '#D97706' },
    INSURANCE:  { label: 'Insurance',       icon: <AlertTriangle size={15} />, bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', textColor: 'text-emerald-600 dark:text-emerald-400', borderColor: '#10B981' },
    DEBT:       { label: 'Debt Collection', icon: <DollarSign size={15} />,   bgColor: 'bg-red-50 dark:bg-red-900/20',         textColor: 'text-red-600 dark:text-red-400',         borderColor: '#EF4444' },
    OTHER:      { label: 'Other',           icon: <ClipboardList size={15} />, bgColor: 'bg-slate-100 dark:bg-slate-800',       textColor: 'text-slate-500 dark:text-slate-400',     borderColor: '#94A3B8' },
  };

  const getNextDocumentStatus = (meeting: any) => {
      const mDate = new Date(meeting.date);
      const today = new Date(); today.setHours(0,0,0,0);

      if (meeting.isPastMeeting) {
          const minPref = new Date(mDate); minPref.setDate(minPref.getDate() + (meeting.minutesPrefDays || 7));
          const minDead = new Date(mDate); minDead.setDate(minDead.getDate() + (meeting.minutesDeadDays || 14));
          const isUrgent = today > minDead;
          const isWarning = today >= minPref;
          return {
              label: 'After Meeting',
              pref: minPref.toISOString().split('T')[0],
              deadline: minDead.toISOString().split('T')[0],
              status: isUrgent ? 'urgent' : (isWarning ? 'warning' : 'good'),
              issuedItems: [] as { label: string; date: string }[],
          };
      }

      let noiPref: Date;
      let noiDead: Date;
      let nomPref: Date;
      let nomDead: Date;

      if (meeting.complexType === 'Incorporated Society') {
          const nomPeriod = meeting.nomDaysPrior || 7;
          nomDead = new Date(mDate);
          nomDead.setDate(nomDead.getDate() - nomPeriod);
          
          // Pref for NOM is 1 week prior to deadline
          nomPref = new Date(nomDead);
          nomPref.setDate(nomPref.getDate() - 7);

          // Deadline for NOI is 1 week prior to NOM deadline
          noiDead = new Date(nomDead);
          noiDead.setDate(noiDead.getDate() - 7);
          
          // Pref for NOI is 2 weeks prior to NOM deadline
          noiPref = new Date(nomDead);
          noiPref.setDate(noiPref.getDate() - 14);
      } else {
          // Body Corporate Statutory Rules (UTA 2010)
          noiPref = new Date(mDate); noiPref.setDate(noiPref.getDate() - 35); // 5 weeks
          noiDead = new Date(mDate); noiDead.setDate(noiDead.getDate() - 21); // 3 weeks
          
          nomPref = new Date(mDate); nomPref.setDate(nomPref.getDate() - 21); // 3 weeks
          nomDead = new Date(mDate); nomDead.setDate(nomDead.getDate() - 14); // 2 weeks
      }

      const processStatus = (pref: Date, dead: Date) => {
          const isUrgent = today > pref;
          const upcomingTrigger = new Date(pref);
          upcomingTrigger.setDate(upcomingTrigger.getDate() - 7);
          const isWarning = today >= upcomingTrigger;
          return { isUrgent, isWarning, prefStr: pref.toISOString().split('T')[0], deadStr: dead.toISOString().split('T')[0] };
      };

      if (!meeting.noiIssued && !meeting.noiNotApplicable) {
          const s = processStatus(noiPref, noiDead);
          return {
            label: 'NOI Required',
            pref: s.prefStr,
            deadline: s.deadStr,
            status: s.isUrgent ? 'urgent' : (s.isWarning ? 'warning' : 'good'),
            issuedItems: [] as { label: string; date: string }[],
          };
      }

      if (!meeting.nomIssued) {
          const s = processStatus(nomPref, nomDead);
          return {
            label: 'NOM Required',
            pref: s.prefStr,
            deadline: s.deadStr,
            status: s.isUrgent ? 'urgent' : (s.isWarning ? 'warning' : 'good'),
            issuedItems: meeting.noiIssuedDate ? [{ label: 'NOI', date: meeting.noiIssuedDate }] : [] as { label: string; date: string }[],
          };
      }

      if (!meeting.minutesIssued) {
          const priorDue = subtractWorkingDays(mDate, 2);
          const warnDate = new Date(priorDue);
          warnDate.setDate(warnDate.getDate() - 7);
          const isUrgent = today >= priorDue;
          const isWarning = today >= warnDate;
          return {
              label: 'Prior to Meeting',
              pref: priorDue.toISOString().split('T')[0],
              deadline: priorDue.toISOString().split('T')[0],
              status: isUrgent ? 'urgent' : (isWarning ? 'warning' : 'good'),
              issuedItems: [
                  ...(meeting.noiIssuedDate ? [{ label: 'NOI', date: meeting.noiIssuedDate }] : []),
                  ...(meeting.nomIssuedDate ? [{ label: 'NOM', date: meeting.nomIssuedDate }] : []),
              ] as { label: string; date: string }[],
          };
      }

      return {
          label: 'Notices Sent', pref: 'Complete', deadline: 'Complete', status: 'good',
          issuedItems: [
              ...(meeting.noiIssuedDate ? [{ label: 'NOI', date: meeting.noiIssuedDate }] : []),
              ...(meeting.nomIssuedDate ? [{ label: 'NOM', date: meeting.nomIssuedDate }] : []),
          ] as { label: string; date: string }[],
      };
  };

  const handleLevyMarkDone = async (bcId: string) => {
      const bc = complexes.find(c => c.id === bcId);
      if (!bc) return;
      await updateComplex({ ...bc, lastDebtCollectionDate: new Date().toISOString().split('T')[0] });
  };

  const toggleSection = (cat: string) => {
    setOpenSections(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  };

  const navigateToProperty = (bcId: string, reminderType: ReminderType, message: string) => {
      // Determine tab based on type or message content
      const isMeeting = reminderType === ReminderType.AGM || message.includes('Notice') || message.includes('NOI') || message.includes('NOM');
      const isComplianceOrInsurance = reminderType === ReminderType.INSURANCE || 
                                     reminderType === ReminderType.INSURANCE_VALUATION || 
                                     reminderType === ReminderType.BWOF ||
                                     reminderType === ReminderType.COMPLIANCE ||
                                     message.toLowerCase().includes('insurance') || 
                                     message.toLowerCase().includes('valuation') ||
                                     message.toLowerCase().includes('bwof');
      
      if (isMeeting) {
          navigate(`/complexes?id=${bcId}&tab=meetings&from=dashboard`);
      } else if (isComplianceOrInsurance) {
          navigate(`/complexes?id=${bcId}&tab=details&from=dashboard`);
      } else {
          navigate(`/complexes?id=${bcId}&tab=details&from=dashboard`);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Overview of managed properties in Auckland</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <Filter size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Filter by Manager:</span>
                <select 
                    className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer outline-none"
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                >
                    <option value="all">All Managers</option>
                    {managers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Upcoming Actions', val: upcomingActions.length + meetingChecklistItems.length + levyReminders.length, icon: <ClipboardList />, color: 'pink', onClick: () => upcomingActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
          { label: 'Critical Alerts', val: criticalAlerts.length, icon: <AlertTriangle />, color: 'amber', onClick: () => criticalAlertsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
          { label: 'AGMs Remaining This Year', val: agmsRemainingThisYear, icon: <Calendar />, color: 'blue', onClick: () => navigate('/complexes') }
        ].map((stat, i) => (
          <div key={i} onClick={stat.onClick} className="cursor-pointer hover:shadow-md bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all text-left group">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                stat.color === 'pink' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/20' :
                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                stat.color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' :
                'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
              }`}>
                {stat.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.val}</p>
              </div>
              <ChevronRight size={18} className="text-slate-200 dark:text-slate-700 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* Category Work Sections */}
        <div
          className="lg:col-span-3 lg:order-2 space-y-3"
          ref={(el) => {
            (upcomingActionsRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            (criticalAlertsRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
        >
          {categorySections.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-10 text-center flex flex-col items-center gap-2 shadow-sm transition-colors">
              <CheckCircle2 size={32} className="text-emerald-400 opacity-60" />
              <p className="text-sm text-slate-400">No pending actions or alerts.</p>
            </div>
          ) : (
            categorySections.map(({ cat, alerts, actions, checklistItems }) => {
              const cfg = CAT_CONFIG[cat as DashboardCat];
              const isOpen = openSections.has(cat);
              const totalActions = actions.length + checklistItems.length;
              return (
                <div
                  key={cat}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-all"
                  style={{ borderLeft: `4px solid ${cfg.borderColor}` }}
                >
                  {/* Section header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none"
                    onClick={() => toggleSection(cat)}
                  >
                    <div className={`p-1.5 rounded-lg ${cfg.bgColor}`}>
                      <span className={cfg.textColor}>{cfg.icon}</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">{cfg.label}</span>
                    {alerts.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50">
                        {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {totalActions > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                        {totalActions} upcoming
                      </span>
                    )}
                    <div className="ml-auto text-slate-300 dark:text-slate-600">
                      {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </div>

                  {/* Section body */}
                  {isOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800">

                      {/* Alert zone (top) — only rendered when alerts exist */}
                      {alerts.length > 0 && (
                        <div className="bg-red-50/30 dark:bg-red-950/10 border-b border-slate-100 dark:border-slate-800">
                          <div className="px-4 py-1.5 border-b border-red-100/60 dark:border-red-900/20">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-red-500">⚠ Critical Alerts</span>
                          </div>
                          <div className="divide-y divide-red-50 dark:divide-red-900/20">
                            {Object.entries(
                              alerts.reduce((acc: Record<string, { bcName: string; items: typeof alerts }>, a) => {
                                if (!acc[a.bcId]) acc[a.bcId] = { bcName: a.bcName, items: [] };
                                acc[a.bcId].items.push(a);
                                return acc;
                              }, {})
                            ).map(([bcId, { bcName, items }]) => (
                              <div key={bcId}>
                                <div className="px-4 py-1 bg-red-100/30 dark:bg-red-900/20 border-b border-red-100/60 dark:border-red-900/20">
                                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{bcName}</span>
                                </div>
                                {items.map(alert => {
                                  const chip = getDueChip(alert.dueDate);
                                  return (
                                    <div
                                      key={alert.id}
                                      className="flex items-start gap-2 px-4 py-2.5 hover:bg-red-50/60 dark:hover:bg-red-950/20 cursor-pointer group transition-colors"
                                      onClick={() => navigateToProperty(alert.bcId, alert.type, alert.message)}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-snug">{alert.message}</div>
                                      </div>
                                      <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${chip.cls}`}>{chip.label}</span>
                                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                                        <button
                                          onClick={e => { e.stopPropagation(); setSnoozeTarget(alert); setSnoozeGroupItems([alert]); }}
                                          className="p-1 rounded text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                          title="Snooze"
                                        ><BellOff size={12} /></button>
                                        <button
                                          onClick={e => { e.stopPropagation(); setSelectedReminder(alert); }}
                                          className="p-1 rounded text-slate-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                                          title="Audit Trail"
                                        ><MessageCircle size={12} /></button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action zone (bottom) — only rendered when actions exist */}
                      {totalActions > 0 && (
                        <div>
                          <div className="px-4 py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">↗ Upcoming Actions</span>
                          </div>
                          {(() => {
                            type ActionEntry =
                              | { kind: 'levy'; id: string; bcId: string; bcName: string; rem: Reminder }
                              | { kind: 'action'; id: string; bcId: string; bcName: string; rem: Reminder }
                              | { kind: 'checklist'; id: string; bcId: string; bcName: string; ci: any };
                            const allEntries: ActionEntry[] = [
                              ...actions.filter(r => r.type === ReminderType.LEVY).map(rem => ({ kind: 'levy' as const, id: rem.id, bcId: rem.bcId, bcName: rem.bcName, rem })),
                              ...actions.filter(r => r.type !== ReminderType.LEVY).map(rem => ({ kind: 'action' as const, id: rem.id, bcId: rem.bcId, bcName: rem.bcName, rem })),
                              ...checklistItems.map(ci => ({ kind: 'checklist' as const, id: ci.key, bcId: ci.bcId, bcName: ci.bcName, ci })),
                            ];
                            const groupedMap: Record<string, { bcName: string; entries: ActionEntry[] }> = {};
                            allEntries.forEach(e => {
                              if (!groupedMap[e.bcId]) groupedMap[e.bcId] = { bcName: e.bcName, entries: [] };
                              groupedMap[e.bcId].entries.push(e);
                            });
                            return (
                              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {Object.entries(groupedMap).map(([bcId, { bcName, entries }]) => (
                                  <div key={bcId}>
                                    <div className="px-4 py-1 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{bcName}</span>
                                    </div>
                                    {entries.map(entry => {
                                      if (entry.kind === 'levy') {
                                        const chip = getDueChip(entry.rem.dueDate);
                                        return (
                                          <div key={entry.id} className="flex items-start gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                                            <div className="flex-1 min-w-0">
                                              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">{entry.rem.message}</div>
                                            </div>
                                            <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${chip.cls}`}>{chip.label}</span>
                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                                              <button onClick={e => { e.stopPropagation(); setSnoozeTarget(entry.rem); setSnoozeGroupItems([entry.rem]); }} className="p-1 rounded text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Snooze"><BellOff size={12} /></button>
                                              <button onClick={() => handleLevyMarkDone(entry.rem.bcId)} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Mark Done"><CheckCircle2 size={12} /></button>
                                            </div>
                                          </div>
                                        );
                                      }
                                      if (entry.kind === 'action') {
                                        const chip = getDueChip(entry.rem.dueDate);
                                        return (
                                          <div key={entry.id} className="flex items-start gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group transition-colors" onClick={() => navigateToProperty(entry.rem.bcId, entry.rem.type, entry.rem.message)}>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">{entry.rem.message}</div>
                                            </div>
                                            <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${chip.cls}`}>{chip.label}</span>
                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                                              <button onClick={e => { e.stopPropagation(); setSnoozeTarget(entry.rem); setSnoozeGroupItems([entry.rem]); }} className="p-1 rounded text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Snooze"><BellOff size={12} /></button>
                                              <button onClick={e => { e.stopPropagation(); setSelectedReminder(entry.rem); }} className="p-1 rounded text-slate-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors" title="Log Details"><MessageCircle size={12} /></button>
                                            </div>
                                          </div>
                                        );
                                      }
                                      const chip = getDueChip(entry.ci.dueDate);
                                      const stageLabel = entry.ci.stage === 'PRIOR_TO_MEETING' ? 'Prior to Meeting' : 'After Meeting';
                                      return (
                                        <div key={entry.id} className="flex items-start gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group transition-colors" onClick={() => navigate(`/complexes?id=${entry.ci.bcId}&tab=meetings&from=dashboard`)}>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">{stageLabel}: {entry.ci.item.label}</div>
                                          </div>
                                          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${chip.cls}`}>{chip.label}</span>
                                          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-pink-500 shrink-0 mt-0.5" />
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Snoozed upcoming actions */}
          {snoozedUpcomingActions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
              <button
                onClick={() => setShowSnoozedActions(!showSnoozedActions)}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <BellOff size={13} />
                <span className="font-bold">{snoozedUpcomingActions.length} snoozed action{snoozedUpcomingActions.length !== 1 ? 's' : ''}</span>
                <span className="ml-auto">{showSnoozedActions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
              </button>
              {showSnoozedActions && (
                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {snoozedUpcomingActions.map(rem => {
                    const snooze = snoozedAlerts.find(s => s.reminderId === rem.id);
                    return (
                      <div key={rem.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{rem.bcName}</p>
                          {snooze && (
                            <p className="text-[10px] text-amber-500 flex items-center gap-1 mt-0.5">
                              <BellOff size={9} /> Wakes {new Date(snooze.snoozedUntil).toLocaleDateString('en-NZ')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => unsnoozeAlert(rem.id)}
                          className="text-[10px] px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 transition-colors"
                        >
                          Unsnooze
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Snoozed alerts */}
          {snoozedCriticalAlerts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
              <button
                onClick={() => setShowSnoozed(!showSnoozed)}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <BellOff size={13} />
                <span className="font-bold">{snoozedCriticalAlerts.length} snoozed alert{snoozedCriticalAlerts.length !== 1 ? 's' : ''}</span>
                <span className="ml-auto">{showSnoozed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
              </button>
              {showSnoozed && (
                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {snoozedCriticalAlerts.map(rem => {
                    const snooze = snoozedAlerts.find(s => s.reminderId === rem.id);
                    return (
                      <div key={rem.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{rem.bcName}</p>
                          {snooze && (
                            <p className="text-[10px] text-amber-500 flex items-center gap-1 mt-0.5">
                              <BellOff size={9} /> Wakes {new Date(snooze.snoozedUntil).toLocaleDateString('en-NZ')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => unsnoozeAlert(rem.id)}
                          className="text-[10px] px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 transition-colors"
                        >
                          Unsnooze
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meetings Section */}
        <div className="lg:col-span-2 lg:order-1 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
           <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
            <Clock className="text-pink-500" size={20} />
            Meetings
          </h2>
          <p className="text-xs text-slate-400 mb-4">Upcoming schedule & pending minutes</p>

          <div className="overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {upcomingMeetings.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                      <Calendar size={32} className="mb-2 opacity-50" />
                      <span>No upcoming meetings or pending minutes.</span>
                  </div>
              ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {upcomingMeetings.map((m) => {
                          const docStatus = getNextDocumentStatus(m);
                          const isUrgent = docStatus.status === 'urgent';
                          const isComplete = docStatus.status === 'good';
                          const isNoticeSent = docStatus.label === 'Notices Sent';
                          const priorItems = meetingChecklistItems.filter(ci => ci.meetingId === m.id && ci.stage === 'PRIOR_TO_MEETING');
                          
                          return (
                            <div key={`${m.bcId}-${m.id}`} className="py-4 first:pt-0 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-all"
                            onClick={() => navigate(`/complexes?id=${m.bcId}&tab=meetings&from=dashboard`)}>
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{m.bcNumber}</span>
                                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-pink-500" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {m.isPastMeeting && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">Past</span>}
                                            <span className="text-[10px] bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 px-2 py-0.5 rounded font-bold">{m.type}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-2">{m.bcName}</p>

                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
                                        <Calendar size={12} />
                                        <span>{m.isPastMeeting ? 'Mtg: ' : ''}{new Date(m.date).toLocaleDateString('en-NZ')}{!m.isPastMeeting ? ` at ${m.time}` : ''}</span>
                                    </div>
                                    {!m.isPastMeeting && m.noiResponseDueDate && (
                                        <div className="flex items-center gap-2 text-[10px] text-pink-500 dark:text-pink-400 mb-3">
                                            <Clock size={12} />
                                            <span>Response due: {new Date(m.noiResponseDueDate + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}{m.noiResponseDueTime ? `, ${new Date('1970-01-01T' + m.noiResponseDueTime).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' })}` : ''}</span>
                                        </div>
                                    )}
                                    {(m.isPastMeeting || !m.noiResponseDueDate) && <div className="mb-3" />}

                                    <div className={`text-[10px] p-2.5 rounded-xl border flex flex-col gap-1 transition-colors ${
                                        isUrgent ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:border-red-900/30' :
                                        docStatus.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30' :
                                        docStatus.status === 'good' && !isNoticeSent ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' :
                                        'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:border-slate-700'
                                    }`}>
                                        {docStatus.issuedItems && docStatus.issuedItems.length > 0 && (
                                            <div className="flex flex-col gap-0.5 mb-1 pb-1.5 border-b border-emerald-200/50 dark:border-emerald-900/30">
                                                {docStatus.issuedItems.map((item: { label: string; date: string }) => (
                                                    <div key={item.label} className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 size={9} />
                                                        <span className="font-bold">{item.label} issued: {item.date ? new Date(item.date).toLocaleDateString('en-NZ') : '✓'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight">
                                                {isComplete && isNoticeSent && <CheckCircle2 size={10} />}
                                                {docStatus.label}:
                                            </div>
                                            <span className="font-mono font-bold">
                                                {isNoticeSent ? 'COMPLETE' : ''}
                                            </span>
                                        </div>
                                        {!isNoticeSent && (
                                            <div className="flex flex-col gap-0.5 mt-1 border-t border-current/10 pt-1.5">
                                                {docStatus.label === 'Prior to Meeting' ? (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="opacity-70">Due (2 working days prior):</span>
                                                            <span className="font-bold">{new Date(docStatus.pref!).toLocaleDateString('en-NZ')}</span>
                                                        </div>
                                                        {priorItems.length > 0 && (
                                                            <div className="mt-1.5 flex flex-col gap-1 border-t border-current/10 pt-1.5">
                                                                {priorItems.map(ci => (
                                                                    <div key={ci.key} className="flex items-start gap-1.5">
                                                                        <div className="w-2.5 h-2.5 rounded border border-current/40 shrink-0 mt-px" />
                                                                        <span className="opacity-80 leading-tight">{ci.item.label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : docStatus.label === 'After Meeting' ? (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="opacity-70">Minutes preferred by:</span>
                                                            <span className="font-bold">{new Date(docStatus.pref!).toLocaleDateString('en-NZ')}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="opacity-70">Minutes deadline:</span>
                                                            <span className="font-medium italic">{new Date(docStatus.deadline!).toLocaleDateString('en-NZ')}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="opacity-70">Statutory Deadline:</span>
                                                            <span className="font-bold">{new Date(docStatus.deadline!).toLocaleDateString('en-NZ')}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="opacity-70">Preferred Action Date:</span>
                                                            <span className="font-medium italic">{new Date(docStatus.pref!).toLocaleDateString('en-NZ')}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                            </div>
                          );
                      })}
                  </div>
              )}
          </div>
          <div className="pt-3 mt-3 border-t dark:border-slate-800 flex justify-end">
            <button onClick={() => navigate('/complexes')} className="text-xs text-pink-600 dark:text-pink-400 font-bold hover:underline flex items-center gap-1">
              View all complexes <ArrowRightCircle size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {selectedReminder && (
          <CommentModal
            reminder={selectedReminder}
            comments={actionComments.filter(c => c.reminderId === selectedReminder.id)}
            onClose={() => setSelectedReminder(null)}
            onAddComment={(id, text, u) => addActionComment(id, selectedReminder.bcId, text, u)}
            onDeleteComment={removeActionComment}
            currentUser={user}
          />
      )}
      {snoozeTarget && (
          <SnoozeModal
            reminder={snoozeTarget}
            onClose={() => setSnoozeTarget(null)}
            onSnooze={(_remId, _bcId, days, reason) => {
              if (user) snoozeGroupItems.forEach(item => snoozeAlert(item.id, item.bcId, days, reason, user));
            }}
          />
      )}
    </div>
  );
};

// --- Sub Components ---

const CommentModal: React.FC<{
    reminder: Reminder;
    comments: any[];
    onClose: () => void;
    onAddComment: (id: string, text: string, user: any) => void;
    onDeleteComment: (id: string) => void;
    currentUser: any;
}> = ({ reminder, comments, onClose, onAddComment, onDeleteComment, currentUser }) => {
    const [text, setText] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && currentUser) {
            onAddComment(reminder.id, text, currentUser);
            setText('');
        }
    };

    const isAdmin = currentUser?.role === 'admin';
    const displayedComments = comments.filter(c => showHistory ? true : !c.isDeleted).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border dark:border-slate-800 transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 transition-colors">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Action Log</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{reminder.bcName}</p>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="bg-pink-50 dark:bg-pink-900/10 p-3 rounded-lg border border-pink-100 dark:border-pink-900/30">
                        <p className="text-[10px] font-bold text-pink-800 dark:text-pink-300 uppercase tracking-widest mb-1">Target Action</p>
                        <p className="text-sm font-medium text-pink-700 dark:text-pink-200">{reminder.message}</p>
                    </div>

                    {displayedComments.length === 0 ? (
                        <div className="text-center text-slate-400 py-8 text-sm italic">
                            No notes recorded for this action.
                        </div>
                    ) : (
                        displayedComments.map(comment => (
                            <div key={comment.id} className={`flex flex-col gap-1 ${comment.isDeleted ? 'opacity-50' : ''}`}>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{comment.userName}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(comment.timestamp).toLocaleString('en-NZ', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                    </span>
                                </div>
                                <div className={`p-3 rounded-lg border text-sm shadow-sm group relative transition-colors ${
                                    comment.isDeleted 
                                        ? 'bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/20' 
                                        : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                    {comment.isDeleted ? (
                                        <div className="flex items-center gap-2">
                                            <span className="italic line-through text-slate-400">{comment.text}</span>
                                            <span className="text-[10px] text-red-500 font-bold uppercase border border-red-200 px-1 rounded">Deleted</span>
                                        </div>
                                    ) : (
                                        comment.text
                                    )}
                                    
                                    {!comment.isDeleted && (
                                        <button 
                                            onClick={() => onDeleteComment(comment.id)}
                                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Remove Log"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors"
                            placeholder="Add progress note..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!text.trim()}
                            className="bg-pink-600 hover:bg-pink-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white p-2 rounded-lg transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

const SnoozeModal: React.FC<{
    reminder: Reminder;
    onClose: () => void;
    onSnooze: (reminderId: string, bcId: string, days: number, reason: string) => void;
}> = ({ reminder, onClose, onSnooze }) => {
    const [days, setDays] = useState(3);
    const [reason, setReason] = useState('');

    const previewDate = new Date();
    previewDate.setDate(previewDate.getDate() + days);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;
        onSnooze(reminder.id, reminder.bcId, days, reason.trim());
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border dark:border-slate-800 transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 transition-colors">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <BellOff size={16} className="text-amber-500" /> Snooze Alert
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{reminder.bcName}</p>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300 line-clamp-3">
                        {reminder.message}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-2">
                            Snooze for
                        </label>
                        <div className="grid grid-cols-7 gap-1">
                            {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDays(d)}
                                    className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                                        days === d
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                    }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                            day{days !== 1 ? 's' : ''} — alert returns <span className="font-bold text-amber-600 dark:text-amber-400">{previewDate.toLocaleDateString('en-NZ')}</span>
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-2">
                            Reason <span className="text-red-400 font-normal normal-case">(required)</span>
                        </label>
                        <textarea
                            className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-3 text-sm resize-none outline-none focus:ring-1 focus:ring-amber-500 min-h-[80px]"
                            placeholder="Why is this being snoozed?"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!reason.trim()}
                            className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <BellOff size={14} /> Snooze
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Dashboard;