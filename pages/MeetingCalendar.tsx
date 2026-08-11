
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Meeting, MeetingDateSettings } from '../types';
import { DEFAULT_MEETING_DATE_SETTINGS } from '../constants/defaults';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface CalendarMeeting {
  bcId: string;
  bcName: string;
  bcNumber: string;
  managerName: string;
  meeting: Meeting;
  date: Date;
  isOverdue: boolean;
}

interface KeyDate {
  type: 'noi-pref' | 'noi-stat' | 'noi-resp' | 'nom-pref' | 'nom-stat';
  label: string;
  bcId: string;
  bcName: string;
  bcNumber: string;
}

const TYPE_COLORS: Record<string, string> = {
  AGM:       'bg-pink-600 text-white',
  EGM:       'bg-violet-600 text-white',
  SGM:       'bg-orange-500 text-white',
  Committee: 'bg-sky-600 text-white',
};
const TYPE_DOT: Record<string, string> = {
  AGM:       'bg-pink-500',
  EGM:       'bg-violet-500',
  SGM:       'bg-orange-500',
  Committee: 'bg-sky-500',
};

const KEY_DATE_STYLES: Record<KeyDate['type'], string> = {
  'noi-pref': 'border-l-[3px] border-slate-400 text-slate-500 dark:text-slate-400 pl-1.5',
  'noi-stat': 'border-l-[3px] border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 pl-1.5',
  'noi-resp': 'border-l-[3px] border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 pl-1.5',
  'nom-pref': 'border-l-[3px] border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 pl-1.5',
  'nom-stat': 'border-l-[3px] border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 pl-1.5',
};

const KEY_DATE_LEGEND: Array<{ type: KeyDate['type']; label: string; color: string }> = [
  { type: 'noi-pref', label: 'NOI Pref',  color: 'bg-slate-400' },
  { type: 'noi-stat', label: 'NOI Stat',  color: 'bg-amber-400' },
  { type: 'noi-resp', label: 'NOI Resp',  color: 'bg-rose-400' },
  { type: 'nom-pref', label: 'NOM Pref',  color: 'bg-blue-400' },
  { type: 'nom-stat', label: 'NOM Stat',  color: 'bg-orange-400' },
];

const MeetingCalendar: React.FC = () => {
  const { complexes, loadMeetings, systemSettings } = useData();
  useEffect(() => { loadMeetings(); }, [loadMeetings]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [filterManager, setFilterManager] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showKeyDates, setShowKeyDates] = useState(true);

  const managers = useMemo(() => {
    const names = new Set(complexes.filter(c => !c.isArchived).map(c => c.managerName).filter(Boolean));
    return Array.from(names).sort();
  }, [complexes]);

  const allMeetings = useMemo((): CalendarMeeting[] => {
    const result: CalendarMeeting[] = [];
    complexes.filter(c => !c.isArchived).forEach(bc => {
      (bc.meetings || []).forEach(m => {
        if (!m.date) return;
        const date = new Date(m.date + 'T00:00:00');
        result.push({
          bcId: bc.id,
          bcName: bc.name,
          bcNumber: bc.bcNumber,
          managerName: bc.managerName,
          meeting: m,
          date,
          isOverdue: date < today,
        });
      });
    });
    return result;
  }, [complexes]);

  const filtered = useMemo(() => allMeetings.filter(m =>
    (filterManager === 'all' || m.managerName === filterManager) &&
    (filterType === 'all' || m.meeting.type === filterType)
  ), [allMeetings, filterManager, filterType]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const meetingsByDay = useMemo(() => {
    const map: Record<number, CalendarMeeting[]> = {};
    filtered.forEach(m => {
      if (m.date.getFullYear() === year && m.date.getMonth() === month) {
        const d = m.date.getDate();
        if (!map[d]) map[d] = [];
        map[d].push(m);
      }
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => (a.meeting.time || '').localeCompare(b.meeting.time || '')));
    return map;
  }, [filtered, year, month]);

  const keyDatesByDay = useMemo(() => {
    if (!showKeyDates) return {} as Record<number, KeyDate[]>;
    const map: Record<number, KeyDate[]> = {};
    filtered.forEach(cm => {
      if (!cm.meeting.date || cm.meeting.type === 'Committee') return;
      const bc = complexes.find(c => c.id === cm.bcId);
      const typeKey = bc?.type === 'Incorporated Society' ? 'rs' : 'bc';
      const sysDefault = systemSettings?.meetingDateSettings?.[typeKey] || DEFAULT_MEETING_DATE_SETTINGS[typeKey];
      const s: MeetingDateSettings = { ...sysDefault, ...(bc?.meetingDateSettings || {}) };
      const meetDate = new Date(cm.meeting.date + 'T00:00:00');
      const shift = (days: number) => { const d = new Date(meetDate); d.setDate(d.getDate() + days); return d; };
      const candidates: Array<{ type: KeyDate['type']; label: string; date: Date }> = [
        { type: 'noi-pref', label: 'NOI Pref', date: shift(-s.noiPreferDays) },
        { type: 'noi-stat', label: 'NOI Stat', date: shift(-s.noiDeadlineDays) },
        ...(cm.meeting.noiResponseDueDate ? [{ type: 'noi-resp' as const, label: 'NOI Resp', date: new Date(cm.meeting.noiResponseDueDate + 'T00:00:00') }] : []),
        { type: 'nom-pref', label: 'NOM Pref', date: shift(-s.nomPreferDays) },
        { type: 'nom-stat', label: 'NOM Stat', date: shift(-s.nomDeadlineDays) },
      ];
      candidates.forEach(({ type, label, date }) => {
        if (date.getFullYear() === year && date.getMonth() === month) {
          const d = date.getDate();
          if (!map[d]) map[d] = [];
          map[d].push({ type, label, bcId: cm.bcId, bcName: cm.bcName, bcNumber: cm.bcNumber });
        }
      });
    });
    return map;
  }, [filtered, year, month, showKeyDates, systemSettings, complexes]);

  const upcomingAll = useMemo(() =>
    filtered.filter(m => m.date >= today).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 8),
    [filtered]
  );

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Calendar size={22} className="text-pink-600" /> Meeting Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">All meetings across the portfolio</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterManager}
            onChange={e => setFilterManager(e.target.value)}
            className="border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Managers</option>
            {managers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            {['AGM','EGM','SGM','Committee'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-3 py-2 text-sm border dark:border-slate-700 rounded-lg dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Today
          </button>
          <label className="flex items-center gap-1.5 cursor-pointer select-none border dark:border-slate-700 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={showKeyDates}
              onChange={e => setShowKeyDates(e.target.checked)}
              className="rounded text-pink-600 focus:ring-pink-500 w-3.5 h-3.5"
            />
            <span className="text-sm dark:text-white whitespace-nowrap">Key Dates</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-800">
            <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors dark:text-white">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-base font-bold dark:text-white">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors dark:text-white">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b dark:border-slate-800">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} className="border-b border-r dark:border-slate-800/60 min-h-[80px] bg-slate-50/50 dark:bg-slate-950/30" />;
              const cellDate = new Date(year, month, day);
              const isToday = cellDate.getTime() === today.getTime();
              const dayMeetings = meetingsByDay[day] || [];
              const dayKeyDates = keyDatesByDay[day] || [];
              const shownMeetings = dayMeetings.slice(0, 3);
              const shownKeyDates = dayKeyDates.slice(0, 3);
              const totalExtra = (dayMeetings.length - shownMeetings.length) + (dayKeyDates.length - shownKeyDates.length);
              return (
                <div key={day} className={`border-b border-r dark:border-slate-800/60 min-h-[80px] p-1.5 ${isToday ? 'bg-pink-50 dark:bg-pink-950/20' : ''}`}>
                  <span className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${isToday ? 'bg-pink-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {shownMeetings.map((m, j) => (
                      <button
                        key={j}
                        onClick={() => navigate(`/complexes?id=${m.bcId}&tab=meetings`)}
                        className={`w-full text-left text-[10px] font-bold px-1.5 py-0.5 rounded truncate leading-tight ${m.isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' : TYPE_COLORS[m.meeting.type] || 'bg-slate-200 text-slate-700'}`}
                        title={`${m.meeting.type} — ${m.bcName}`}
                      >
                        {m.meeting.type} {m.bcNumber}
                      </button>
                    ))}
                    {shownKeyDates.map((kd, j) => (
                      <button
                        key={`kd-${j}`}
                        onClick={() => navigate(`/complexes?id=${kd.bcId}&tab=meetings`)}
                        className={`w-full text-left text-[10px] font-semibold py-0.5 rounded-r truncate leading-tight ${KEY_DATE_STYLES[kd.type]}`}
                        title={`${kd.label} — ${kd.bcName}`}
                      >
                        {kd.label} · {kd.bcNumber}
                      </button>
                    ))}
                    {totalExtra > 0 && (
                      <p className="text-[9px] text-slate-400 px-1">+{totalExtra} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b dark:border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-widest dark:text-white">Upcoming Meetings</h3>
          </div>
          {upcomingAll.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <p className="text-sm text-slate-400">No upcoming meetings match the current filter.</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-800 flex-1 overflow-y-auto">
              {upcomingAll.map((m, i) => {
                const daysUntil = Math.ceil((m.date.getTime() - today.getTime()) / 86400000);
                return (
                  <button
                    key={i}
                    onClick={() => navigate(`/complexes?id=${m.bcId}&tab=meetings`)}
                    className="w-full text-left px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${TYPE_COLORS[m.meeting.type] || 'bg-slate-200 text-slate-700'}`}>
                        {m.meeting.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold dark:text-white truncate">{m.bcName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {m.date.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {m.meeting.time ? ` · ${m.meeting.time}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{m.managerName}</p>
                      </div>
                      <span className={`text-[10px] font-bold flex-shrink-0 ${daysUntil <= 7 ? 'text-red-500' : daysUntil <= 30 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? '1 day' : `${daysUntil}d`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {/* Legend */}
          <div className="px-5 py-3 border-t dark:border-slate-800 flex items-center gap-3 flex-wrap">
            {Object.entries(TYPE_DOT).map(([type, dot]) => (
              <span key={type} className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                {type}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Overdue
            </span>
            {showKeyDates && KEY_DATE_LEGEND.map(({ type, label, color }) => (
              <span key={type} className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className={`w-0.5 h-3 rounded-sm ${color}`} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingCalendar;
