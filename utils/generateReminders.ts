import { BodyCorporate, Reminder, ReminderType, InsuranceSettings, MeetingChecklistItem, MeetingDateSettings } from '../types';
import { DEFAULT_INSURANCE_SETTINGS, DEFAULT_WORKFLOW, DEFAULT_MEETING_DATE_SETTINGS } from '../constants/defaults';

type StageTemplates = { NOI: MeetingChecklistItem[]; NOM: MeetingChecklistItem[]; PRIOR_TO_MEETING: MeetingChecklistItem[]; AFTER_MEETING: MeetingChecklistItem[]; };
type ChecklistTemplates = { bc: StageTemplates; rs: StageTemplates; };
type MeetingDateConfig = { bc: MeetingDateSettings; rs: MeetingDateSettings; };

export function generateReminders(complexes: BodyCorporate[], settings: InsuranceSettings = DEFAULT_INSURANCE_SETTINGS, checklistTemplates?: ChecklistTemplates, meetingDateConfig?: MeetingDateConfig): Reminder[] {
  const reminders: Reminder[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const workflowSteps = settings.workflowSteps || DEFAULT_WORKFLOW;

  const getDateSettings = (bc: BodyCorporate): MeetingDateSettings => {
    const typeKey = bc.type === 'Incorporated Society' ? 'rs' : 'bc';
    const sysDefault = meetingDateConfig?.[typeKey] || DEFAULT_MEETING_DATE_SETTINGS[typeKey];
    return { ...sysDefault, ...bc.meetingDateSettings };
  };

  complexes.filter(c => !c.isArchived).forEach(bc => {
    const progress = bc.insuranceWorkflowProgress || {};

    if (bc.insuranceExpiry) {
      const insDate = new Date(bc.insuranceExpiry);
      const diffDays = Math.ceil((insDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const hasCompletedAnyStep = workflowSteps.some(s => s.id && progress[s.id]?.completed);

      const lastPriorStep = workflowSteps
        .filter(s => s.type === 'prior' && s.id && !(s.isBcOnly && bc.type !== 'Body Corporate'))
        .sort((a, b) => a.offsetDays - b.offsetDays)[0];
      const lastPriorStepDone = lastPriorStep ? !!progress[lastPriorStep.id!]?.completed : false;

      if (diffDays < 0) {
        if (!hasCompletedAnyStep) {
          reminders.push({ id: `ins-exp-${bc.id}`, bcId: bc.id, bcName: bc.name, type: ReminderType.INSURANCE, dueDate: bc.insuranceExpiry, message: `EXPIRED: Insurance on ${bc.insuranceExpiry}`, severity: 'high' });
        }
      } else if (diffDays <= 90) {
        if (!lastPriorStepDone) {
          reminders.push({ id: `ins-${bc.id}`, bcId: bc.id, bcName: bc.name, type: ReminderType.INSURANCE, dueDate: bc.insuranceExpiry, message: `Insurance due in ${diffDays} days.`, severity: diffDays < 30 ? 'high' : 'medium' });
        }
      }

      if (!bc.insuranceCycleComplete) workflowSteps.forEach(step => {
        if (step.isBcOnly && bc.type !== 'Body Corporate') return;
        if (step.id && progress[step.id]?.completed) return;

        const triggerDate = new Date(insDate);
        if (step.type === 'prior') triggerDate.setDate(triggerDate.getDate() - step.offsetDays);
        else triggerDate.setDate(triggerDate.getDate() + step.offsetDays);

        if (today >= triggerDate) {
          if (step.isValuationCheck && bc.lastInsuranceValuationDate) {
            const valAge = (insDate.getTime() - new Date(bc.lastInsuranceValuationDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            if (valAge < settings.valuationValidityYears) return;
          }
          const daysUntilTrigger = Math.ceil((triggerDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          reminders.push({
            id: `wf-${step.id || Math.random()}-${bc.id}`, bcId: bc.id, bcName: bc.name,
            type: step.isValuationCheck ? ReminderType.INSURANCE_VALUATION : step.type === 'after' ? ReminderType.INSURANCE : ReminderType.UPCOMING_ACTION,
            dueDate: triggerDate.toISOString().split('T')[0],
            message: `INSURANCE: ${step.label}`,
            severity: daysUntilTrigger < 0 ? 'high' : 'medium'
          });
        }
      });
    }

    // NOI/NOM reminders — upcoming meetings only
    (bc.meetings || []).forEach(meeting => {
      const mtgDate = new Date(meeting.date);
      if (isNaN(mtgDate.getTime()) || mtgDate < today) return;

      const s = getDateSettings(bc);
      const noiPref = new Date(mtgDate); noiPref.setDate(noiPref.getDate() - s.noiPreferDays);
      const noiDead = new Date(mtgDate); noiDead.setDate(noiDead.getDate() - s.noiDeadlineDays);
      const nomPref = new Date(mtgDate); nomPref.setDate(nomPref.getDate() - s.nomPreferDays);
      const nomDead = new Date(mtgDate); nomDead.setDate(nomDead.getDate() - s.nomDeadlineDays);

      const processMeetingTask = (type: 'NOI' | 'NOM', prefDate: Date, deadDate: Date, issued?: boolean, notApp?: boolean) => {
        if (issued || notApp) return;
        const upcomingTrigger = new Date(prefDate); upcomingTrigger.setDate(upcomingTrigger.getDate() - 7);
        const isOverdue = today > prefDate;
        const isUpcoming = today >= upcomingTrigger;
        if (!isUpcoming && !isOverdue) return;
        reminders.push({
          id: `${type.toLowerCase()}-task-${bc.id}-${meeting.id}`,
          bcId: bc.id, bcName: bc.name,
          type: isOverdue ? ReminderType.AGM : ReminderType.UPCOMING_ACTION,
          dueDate: deadDate.toISOString().split('T')[0],
          message: `${isOverdue ? 'OVERDUE' : 'ACTION'}: Issue ${type} for ${meeting.type} (Mtg: ${meeting.date}). ${isOverdue ? 'Passed Preferred Date: ' + prefDate.toLocaleDateString('en-NZ') : 'Target: ' + prefDate.toLocaleDateString('en-NZ')}`,
          severity: isOverdue ? 'high' : 'medium'
        });
      };

      if (!meeting.noiIssued && !meeting.noiNotApplicable) {
        processMeetingTask('NOI', noiPref, noiDead, false, false);
      } else if (!meeting.nomIssued) {
        processMeetingTask('NOM', nomPref, nomDead, false, false);
      }
    });

    // Minutes reminders — past meetings where minutes not yet issued
    (bc.meetings || []).forEach(meeting => {
      if (meeting.minutesIssued) return;
      const mtgDate = new Date(meeting.date);
      if (isNaN(mtgDate.getTime()) || mtgDate >= today) return;

      const s = getDateSettings(bc);
      const minPref = new Date(mtgDate); minPref.setDate(minPref.getDate() + s.minutesPreferDays);
      const minDead = new Date(mtgDate); minDead.setDate(minDead.getDate() + s.minutesDeadlineDays);

      if (today < minPref) return;

      const daysUntilDead = Math.ceil((minDead.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntilDead < 0;
      reminders.push({
        id: `min-${bc.id}-${meeting.id}`,
        bcId: bc.id, bcName: bc.name,
        type: isOverdue ? ReminderType.AGM : ReminderType.UPCOMING_ACTION,
        dueDate: minDead.toISOString().split('T')[0],
        message: `${isOverdue ? 'OVERDUE' : 'ACTION'}: Issue minutes for ${meeting.type} (Mtg: ${meeting.date}). ${isOverdue ? 'Deadline: ' + minDead.toLocaleDateString('en-NZ') : 'Due by: ' + minDead.toLocaleDateString('en-NZ')}`,
        severity: isOverdue ? 'high' : 'medium',
      });
    });
  });

  // Checklist item due-date reminders
  if (checklistTemplates) {
    complexes.filter(c => !c.isArchived).forEach(bc => {
      const stageTemplates = bc.type === 'Incorporated Society' ? checklistTemplates.rs : checklistTemplates.bc;
      (bc.meetings || []).forEach(meeting => {
        const mtgDate = new Date(meeting.date);
        if (isNaN(mtgDate.getTime())) return;
        if (meeting.minutesIssued) return;
        const progress = meeting.checklistProgress || {};
        (['NOI', 'NOM', 'PRIOR_TO_MEETING', 'AFTER_MEETING'] as const).forEach(stage => {
          (stageTemplates[stage] || []).forEach(item => {
            if (!item.dueDaysBeforeMeeting || progress[item.id]) return;
            const dueDate = new Date(mtgDate);
            dueDate.setDate(dueDate.getDate() + (stage === 'AFTER_MEETING' ? item.dueDaysBeforeMeeting : -item.dueDaysBeforeMeeting));
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue > 7) return;
            const id = `chk-${bc.id}-${meeting.id}-${item.id}`;
            const dueDateStr = dueDate.toISOString().split('T')[0];
            const msg = `CHECKLIST: "${item.label}" — ${meeting.type} on ${mtgDate.toLocaleDateString('en-NZ')}`;
            reminders.push({
              id, bcId: bc.id, bcName: bc.name,
              type: daysUntilDue <= 1 ? ReminderType.COMPLIANCE : ReminderType.UPCOMING_ACTION,
              dueDate: dueDateStr,
              message: msg,
              severity: daysUntilDue <= 1 ? 'high' : 'medium',
            });
          });
        });
      });
    });
  }

  // Levy debt collection reminders
  complexes.filter(c => !c.isArchived).forEach(bc => {
    if (!bc.levyDueDateSchedule || bc.levyDueDateSchedule.length === 0) return;
    const lagDays = bc.debtCollectionReminderDays ?? 7;

    bc.levyDueDateSchedule.forEach((entry, idx) => {
      const dueDate = new Date(today.getFullYear(), entry.month - 1, entry.day);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() + lagDays);

      if (today < reminderDate) return;

      const lastDone = bc.lastDebtCollectionDate ? new Date(bc.lastDebtCollectionDate) : null;
      if (lastDone && lastDone >= dueDate) return;

      reminders.push({
        id: `levy-${bc.id}-${entry.month}-${entry.day}`,
        bcId: bc.id,
        bcName: bc.name,
        type: ReminderType.LEVY,
        dueDate: dueDate.toISOString().split('T')[0],
        message: `DEBT COLLECTION: Levy instalment ${idx + 1} was due ${dueDate.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        severity: 'medium',
      });
    });
  });

  return reminders;
}
