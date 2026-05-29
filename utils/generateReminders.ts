import { BodyCorporate, Reminder, ReminderType, InsuranceSettings } from '../types';
import { DEFAULT_INSURANCE_SETTINGS, DEFAULT_WORKFLOW } from '../constants/defaults';

export function generateReminders(complexes: BodyCorporate[], settings: InsuranceSettings = DEFAULT_INSURANCE_SETTINGS): Reminder[] {
  const reminders: Reminder[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const workflowSteps = settings.workflowSteps || DEFAULT_WORKFLOW;

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

      workflowSteps.forEach(step => {
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

    (bc.meetings || []).forEach(meeting => {
      const mtgDate = new Date(meeting.date);
      if (isNaN(mtgDate.getTime()) || mtgDate < today) return;

      let noiPref: Date, noiDead: Date, nomPref: Date, nomDead: Date;

      if (bc.type === 'Incorporated Society') {
        const nomPeriod = bc.isocNomDaysPrior || 7;
        const dNomDead = new Date(mtgDate); dNomDead.setDate(dNomDead.getDate() - nomPeriod);
        nomDead = dNomDead;
        nomPref = new Date(dNomDead); nomPref.setDate(nomPref.getDate() - 7);
        noiDead = new Date(dNomDead); noiDead.setDate(noiDead.getDate() - 7);
        noiPref = new Date(dNomDead); noiPref.setDate(noiPref.getDate() - 14);
      } else {
        noiPref = new Date(mtgDate); noiPref.setDate(noiPref.getDate() - 35);
        noiDead = new Date(mtgDate); noiDead.setDate(noiDead.getDate() - 21);
        nomPref = new Date(mtgDate); nomPref.setDate(nomPref.getDate() - 21);
        nomDead = new Date(mtgDate); nomDead.setDate(nomDead.getDate() - 14);
      }

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
  });

  return reminders;
}
