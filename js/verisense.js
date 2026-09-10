/**
 * VeriBand — VeriSense Operational Intelligence Engine (js/verisense.js)
 *
 * Pure-logic rule-based analysis over administration log records.
 * PURE LOGIC — ZERO DOM CODE, ZERO CSS/COLORS.
 *
 * Copy rules strictly enforced per AGENTS.md §6 & Concept Note §3:
 * VeriSense copy is strictly OPERATIONAL, never diagnostic or prescriptive.
 * It analyzes workflow patterns (delays, withheld rates, bottlenecks)
 * to support supervisory review; it does NOT make clinical decisions.
 */

import * as data from './data.js';

// Shift window duration in milliseconds (8 hours per standard hospital nursing shift)
const SHIFT_WINDOW_MS = 8 * 60 * 60 * 1000;

// Ward delay cluster rolling window duration (2 hours)
const DELAY_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * Analyzes log entries and returns active operational flags.
 * @param {Array} [logs] - Optional log entries array; defaults to data.getLogEntries()
 * @returns {Array<{ id: string, severity: 'info'|'caution'|'review', rule: string, eyebrow: string, message: string, relatedLogIds: string[], ward?: string, patientId?: string }>}
 */
export function analyzeOperationalPatterns(logs) {
  const entries = logs || data.getLogEntries();
  const flags = [];
  const now = Date.now();

  // --------------------------------------------------------------------------
  // Rule A: >= 3 delayed entries in one ward within a 2-hour rolling window
  // --------------------------------------------------------------------------
  const recentDelayedLogs = entries.filter((entry) => {
    if (entry.status !== 'delayed') return false;
    const entryTime = new Date(entry.timestamp).getTime();
    return now - entryTime <= DELAY_WINDOW_MS;
  });

  // Group delays by ward
  const delaysByWard = {};
  recentDelayedLogs.forEach((entry) => {
    const ward = entry.ward || 'Unknown Ward';
    if (!delaysByWard[ward]) delaysByWard[ward] = [];
    delaysByWard[ward].push(entry);
  });

  Object.entries(delaysByWard).forEach(([ward, wardDelays]) => {
    if (wardDelays.length >= 3) {
      flags.push({
        id: `flag-delayed-${ward.toLowerCase().replace(/\s+/g, '-')}`,
        severity: 'caution',
        rule: 'WARD_DELAY_CLUSTER',
        eyebrow: `Operational Delay Cluster &bull; ${ward}`,
        message: `${wardDelays.length} delayed medication administrations recorded in ${ward} within the last 2 hours. Operational review of floor workload or pharmacy dispensing is recommended.`,
        relatedLogIds: wardDelays.map((l) => l.id),
        ward: ward
      });
    }
  });

  // --------------------------------------------------------------------------
  // Rule B: >= 2 missed/withheld/refused doses for one patient in an 8-hour shift
  // --------------------------------------------------------------------------
  const shiftExceptions = entries.filter((entry) => {
    if (entry.status !== 'withheld' && entry.status !== 'refused' && entry.status !== 'not_administered') {
      return false;
    }
    const entryTime = new Date(entry.timestamp).getTime();
    return now - entryTime <= SHIFT_WINDOW_MS;
  });

  // Group exceptions by patient
  const exceptionsByPatient = {};
  shiftExceptions.forEach((entry) => {
    const ptId = entry.patientId;
    if (!exceptionsByPatient[ptId]) exceptionsByPatient[ptId] = [];
    exceptionsByPatient[ptId].push(entry);
  });

  Object.entries(exceptionsByPatient).forEach(([ptId, ptLogs]) => {
    if (ptLogs.length >= 2) {
      const pt = data.getPatientById(ptId);
      const ptName = pt ? pt.name : `Patient ${ptId}`;
      const ptToken = pt ? ` (${pt.token})` : '';

      flags.push({
        id: `flag-withheld-${ptId}`,
        severity: 'review',
        rule: 'PATIENT_REPEAT_EXCEPTIONS',
        eyebrow: `Repeated Dose Exception &bull; ${ptName}${ptToken}`,
        message: `${ptLogs.length} withheld or refused doses recorded for ${ptName}${ptToken} within the current 8-hour shift. Supervisory follow-up with attending staff recommended.`,
        relatedLogIds: ptLogs.map((l) => l.id),
        patientId: ptId,
        ward: pt ? pt.ward : undefined
      });
    }
  });

  return flags;
}