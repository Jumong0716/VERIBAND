/**
 * VeriBand — Data Layer (js/data.js)
 *
 * Owns canonical data shapes, in-memory state, localStorage synchronization,
 * seeding, and query/mutation functions.
 * No DOM code, no framework, no external dependencies.
 */

const STORAGE_KEY = 'veriband_demo_state';

// In-memory application state
let state = {
  patients: [],
  orders: [],
  logs: []
};

/**
 * Generate seed data with timestamps relative to the execution time.
 * Includes at least:
 * 1) One ward with >= 3 delayed entries within a 2-hour window.
 * 2) One patient with >= 2 missed/withheld doses in one 8-hour shift.
 */
export function seedData() {
  const now = Date.now();
  const minutesAgo = (mins) => new Date(now - mins * 60 * 1000).toISOString();
  const hoursAgo = (hrs) => new Date(now - hrs * 3600 * 1000).toISOString();

  const patients = [
    {
      id: 'pt-101',
      token: 'VB-8291',
      name: 'Elena Rostova',
      age: 58,
      sex: 'Female',
      ward: 'Ward 3',
      room: '304-A',
      admittingComplaint: 'Post-operative monitoring, laparoscopic cholecystectomy',
      status: 'active',
      registeredAt: hoursAgo(14)
    },
    {
      id: 'pt-102',
      token: 'VB-4310',
      name: 'Carlos Mendoza',
      age: 64,
      sex: 'Male',
      ward: 'Ward 3',
      room: '308-B',
      admittingComplaint: 'Acute exacerbation of chronic bronchitis',
      status: 'active',
      registeredAt: hoursAgo(18)
    },
    {
      id: 'pt-103',
      token: 'VB-9154',
      name: 'Maria Clara Santos',
      age: 42,
      sex: 'Female',
      ward: 'Ward 3',
      room: '312-A',
      admittingComplaint: 'Pyelonephritis, IV antibiotic therapy',
      status: 'active',
      registeredAt: hoursAgo(20)
    },
    {
      id: 'pt-104',
      token: 'VB-2748',
      name: 'David Kim',
      age: 71,
      sex: 'Male',
      ward: 'Ward 1',
      room: '105-B',
      admittingComplaint: 'Congestive heart failure decompensation',
      status: 'active',
      registeredAt: hoursAgo(26)
    },
    {
      id: 'pt-105',
      token: 'VB-6032',
      name: 'Grace Ocampo',
      age: 33,
      sex: 'Female',
      ward: 'Ward 1',
      room: '109-A',
      admittingComplaint: 'Severe gastroenteritis with moderate dehydration',
      status: 'active',
      registeredAt: hoursAgo(10)
    },
    {
      id: 'pt-106',
      token: 'VB-1189',
      name: 'Antonio Reyes',
      age: 49,
      sex: 'Male',
      ward: 'Ward 2',
      room: '201-A',
      admittingComplaint: 'Type 2 Diabetes with hyperglycemia',
      status: 'active',
      registeredAt: hoursAgo(30)
    },
    {
      id: 'pt-107',
      token: 'VB-5542',
      name: 'Lourdes Bautista',
      age: 67,
      sex: 'Female',
      ward: 'Ward 2',
      room: '204-B',
      admittingComplaint: 'Community-acquired pneumonia',
      status: 'active',
      registeredAt: hoursAgo(12)
    },
    {
      id: 'pt-108',
      token: 'VB-3890',
      name: 'Mateo Gutierrez',
      age: 29,
      sex: 'Male',
      ward: 'Ward 1',
      room: '114-A',
      admittingComplaint: 'Cellulitis, right lower extremity',
      status: 'active',
      registeredAt: hoursAgo(8)
    },
    {
      id: 'pt-109',
      token: 'VB-7721',
      name: 'Teresa Morales',
      age: 53,
      sex: 'Female',
      ward: 'Ward 2',
      room: '210-A',
      admittingComplaint: 'Uncontrolled essential hypertension',
      status: 'registered',
      registeredAt: hoursAgo(2)
    },
    {
      id: 'pt-110',
      token: 'VB-9403',
      name: 'Rafael Villanueva',
      age: 76,
      sex: 'Male',
      ward: 'Ward 3',
      room: '315-B',
      admittingComplaint: 'Post-op orthopedic repair, left femur fracture',
      status: 'active',
      registeredAt: hoursAgo(36)
    },
    {
      id: 'pt-111',
      token: 'VB-5018',
      name: 'Sofia Fernandez',
      age: 22,
      sex: 'Female',
      ward: 'Ward 1',
      room: '118-A',
      admittingComplaint: 'Asthma exacerbation',
      status: 'discharged',
      registeredAt: hoursAgo(48)
    }
  ];

  const orders = [
    // pt-101 (Elena Rostova - Ward 3)
    {
      id: 'ord-201',
      patientId: 'pt-101',
      medication: 'Cefuroxime IV',
      dosage: '750 mg',
      schedule: 'Every 8h',
      orderedBy: 'Dr. Aris Thorne',
      status: 'pending'
    },
    {
      id: 'ord-202',
      patientId: 'pt-101',
      medication: 'Tramadol IV',
      dosage: '50 mg',
      schedule: 'Every 6h PRN',
      orderedBy: 'Dr. Aris Thorne',
      status: 'completed'
    },
    // pt-102 (Carlos Mendoza - Ward 3)
    {
      id: 'ord-203',
      patientId: 'pt-102',
      medication: 'Methylprednisolone IV',
      dosage: '40 mg',
      schedule: 'Every 12h',
      orderedBy: 'Dr. Leah Vance',
      status: 'pending'
    },
    {
      id: 'ord-204',
      patientId: 'pt-102',
      medication: 'Salbutamol Nebulization',
      dosage: '2.5 mg',
      schedule: 'Every 4h',
      orderedBy: 'Dr. Leah Vance',
      status: 'pending'
    },
    // pt-103 (Maria Clara Santos - Ward 3)
    {
      id: 'ord-205',
      patientId: 'pt-103',
      medication: 'Ceftriaxone IV',
      dosage: '1 g',
      schedule: 'Every 24h',
      orderedBy: 'Dr. Marco Ramos',
      status: 'pending'
    },
    {
      id: 'ord-206',
      patientId: 'pt-103',
      medication: 'Paracetamol IV',
      dosage: '1 g',
      schedule: 'Every 6h PRN',
      orderedBy: 'Dr. Marco Ramos',
      status: 'completed'
    },
    // pt-104 (David Kim - Ward 1) - Withheld trigger patient
    {
      id: 'ord-207',
      patientId: 'pt-104',
      medication: 'Furosemide IV',
      dosage: '40 mg',
      schedule: 'Every 12h',
      orderedBy: 'Dr. Rachel Tan',
      status: 'pending'
    },
    {
      id: 'ord-208',
      patientId: 'pt-104',
      medication: 'Digoxin Oral',
      dosage: '0.125 mg',
      schedule: 'Once daily (morning)',
      orderedBy: 'Dr. Rachel Tan',
      status: 'pending'
    },
    // pt-105 (Grace Ocampo - Ward 1)
    {
      id: 'ord-209',
      patientId: 'pt-105',
      medication: 'Ondansetron IV',
      dosage: '4 mg',
      schedule: 'Every 8h',
      orderedBy: 'Dr. Aris Thorne',
      status: 'pending'
    },
    // pt-106 (Antonio Reyes - Ward 2)
    {
      id: 'ord-210',
      patientId: 'pt-106',
      medication: 'Regular Insulin SubQ',
      dosage: '8 units',
      schedule: 'Pre-meals TID',
      orderedBy: 'Dr. Leah Vance',
      status: 'pending'
    },
    // pt-107 (Lourdes Bautista - Ward 2)
    {
      id: 'ord-211',
      patientId: 'pt-107',
      medication: 'Levofloxacin IV',
      dosage: '500 mg',
      schedule: 'Once daily',
      orderedBy: 'Dr. Marco Ramos',
      status: 'pending'
    },
    // pt-108 (Mateo Gutierrez - Ward 1)
    {
      id: 'ord-212',
      patientId: 'pt-108',
      medication: 'Oxacillin IV',
      dosage: '1 g',
      schedule: 'Every 6h',
      orderedBy: 'Dr. Rachel Tan',
      status: 'pending'
    },
    // pt-110 (Rafael Villanueva - Ward 3)
    {
      id: 'ord-213',
      patientId: 'pt-110',
      medication: 'Enoxaparin SubQ',
      dosage: '40 mg',
      schedule: 'Once daily',
      orderedBy: 'Dr. Aris Thorne',
      status: 'pending'
    }
  ];

  const logs = [
    // Ward 3 DELAY CLUSTER (within the last 2 hours):
    // >= 3 delayed entries in Ward 3 within 2 hours
    {
      id: 'log-301',
      patientId: 'pt-101',
      orderId: 'ord-202',
      status: 'delayed',
      timestamp: minutesAgo(85),
      ward: 'Ward 3',
      recordedBy: 'Nurse J. Cruz, RN',
      notes: 'Pharmacy delivery delay; administered 45 min past window'
    },
    {
      id: 'log-302',
      patientId: 'pt-102',
      orderId: 'ord-204',
      status: 'delayed',
      timestamp: minutesAgo(50),
      ward: 'Ward 3',
      recordedBy: 'Nurse J. Cruz, RN',
      notes: 'Patient was off-floor for chest radiography'
    },
    {
      id: 'log-303',
      patientId: 'pt-103',
      orderId: 'ord-206',
      status: 'delayed',
      timestamp: minutesAgo(25),
      ward: 'Ward 3',
      recordedBy: 'Nurse M. Delgado, RN',
      notes: 'IV line infiltration; IV site re-established prior to dose'
    },
    {
      id: 'log-304',
      patientId: 'pt-110',
      orderId: 'ord-213',
      status: 'delayed',
      timestamp: minutesAgo(10),
      ward: 'Ward 3',
      recordedBy: 'Nurse M. Delgado, RN',
      notes: 'Nurse attending emergency in room 302'
    },

    // Patient pt-104 MISSED/WITHHELD DOSES CLUSTER (Ward 1, within 8h shift window):
    // >= 2 missed/withheld doses for one patient in one shift
    {
      id: 'log-305',
      patientId: 'pt-104',
      orderId: 'ord-208',
      status: 'withheld',
      timestamp: hoursAgo(5),
      ward: 'Ward 1',
      recordedBy: 'Nurse S. Rivera, RN',
      notes: 'Apical heart rate 52 bpm (< 60 bpm threshold); physician notified'
    },
    {
      id: 'log-306',
      patientId: 'pt-104',
      orderId: 'ord-207',
      status: 'withheld',
      timestamp: hoursAgo(2),
      ward: 'Ward 1',
      recordedBy: 'Nurse S. Rivera, RN',
      notes: 'Systolic blood pressure 86 mmHg; dose held per protocol'
    },

    // Other baseline logs for realism and dashboard statistics
    {
      id: 'log-307',
      patientId: 'pt-106',
      orderId: 'ord-210',
      status: 'administered',
      timestamp: hoursAgo(3),
      ward: 'Ward 2',
      recordedBy: 'Nurse K. Villanueva, RN',
      notes: 'Administered before lunch'
    },
    {
      id: 'log-308',
      patientId: 'pt-107',
      orderId: 'ord-211',
      status: 'administered',
      timestamp: hoursAgo(4),
      ward: 'Ward 2',
      recordedBy: 'Nurse K. Villanueva, RN',
      notes: 'Infusion completed uneventfully'
    },
    {
      id: 'log-309',
      patientId: 'pt-105',
      orderId: 'ord-209',
      status: 'administered',
      timestamp: hoursAgo(1),
      ward: 'Ward 1',
      recordedBy: 'Nurse S. Rivera, RN',
      notes: 'Slow IV push tolerated well'
    },
    {
      id: 'log-310',
      patientId: 'pt-108',
      orderId: 'ord-212',
      status: 'refused',
      timestamp: hoursAgo(6),
      ward: 'Ward 1',
      recordedBy: 'Nurse S. Rivera, RN',
      notes: 'Patient requested to sleep, refused 06:00 dose'
    },
    {
      id: 'log-311',
      patientId: 'pt-101',
      orderId: 'ord-201',
      status: 'administered',
      timestamp: hoursAgo(7),
      ward: 'Ward 3',
      recordedBy: 'Nurse J. Cruz, RN',
      notes: 'Administered on schedule'
    },
    {
      id: 'log-312',
      patientId: 'pt-102',
      orderId: 'ord-203',
      status: 'not_administered',
      timestamp: hoursAgo(8),
      ward: 'Ward 3',
      recordedBy: 'Nurse J. Cruz, RN',
      notes: 'Held awaiting physician consultation note'
    }
  ];

  // All seed orders start as active on the doctor's order ledger. This field
  // is independent from `status` (pending/completed), which tracks whether a
  // nurse has recorded an administration outcome for the order.
  orders.forEach((o) => {
    if (!o.orderState) o.orderState = 'active';
  });

  return { patients, orders, logs };
}

/**
 * Save current state to localStorage.
 */
export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('VeriBand: Failed to save state to localStorage', err);
  }
}

/**
 * Load state from localStorage or seed fresh if empty.
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        Array.isArray(parsed.patients) &&
        Array.isArray(parsed.orders) &&
        Array.isArray(parsed.logs)
      ) {
        state = parsed;
        return state;
      }
    }
  } catch (err) {
    console.warn('VeriBand: Corrupted state in localStorage, re-seeding fresh data.', err);
  }

  return resetState();
}

/**
 * Resets state with fresh seedData() and overwrites localStorage.
 */
export function resetState() {
  state = seedData();
  saveState();
  return state;
}

/**
 * Read current in-memory state (returns shallow clone).
 */
export function getState() {
  return { ...state };
}

/**
 * Retrieve patient by unique QR token.
 * @param {string} token - e.g. "VB-8291"
 * @returns {object|null}
 */
export function getPatientByToken(token) {
  if (!token) return null;
  const normalized = token.trim().toUpperCase();
  return state.patients.find((p) => p.token.toUpperCase() === normalized) || null;
}

/**
 * Retrieve patient by patient ID.
 * @param {string} id - e.g. "pt-101"
 * @returns {object|null}
 */
export function getPatientById(id) {
  return state.patients.find((p) => p.id === id) || null;
}

/**
 * Get all patients, optionally filtered by search query or status.
 * @param {object} [filter]
 * @returns {Array}
 */
export function getPatients(filter = {}) {
  let list = [...state.patients];
  if (filter.status) {
    list = list.filter((p) => p.status === filter.status);
  }
  if (filter.ward) {
    list = list.filter((p) => p.ward === filter.ward);
  }
  if (filter.query) {
    const q = filter.query.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.token.toLowerCase().includes(q) ||
        p.ward.toLowerCase().includes(q) ||
        p.room.toLowerCase().includes(q)
    );
  }
  return list;
}

/**
 * Get all medication orders for a specific patient.
 * By default, discontinued orders are excluded so bedside/supervisor
 * workflows never see or act on an order a doctor has discontinued.
 * @param {string} patientId
 * @param {object} [opts] - { includeDiscontinued?: boolean }
 * @returns {Array}
 */
export function getOrdersForPatient(patientId, opts = {}) {
  const list = state.orders.filter((o) => o.patientId === patientId);
  if (opts.includeDiscontinued) return list;
  return list.filter((o) => o.orderState !== 'discontinued');
}

/**
 * Query log entries with optional filters.
 * @param {object} [filters] - { ward?, patientId?, status?, limit? }
 * @returns {Array}
 */
export function getLogEntries(filters = {}) {
  let entries = [...state.logs];

  if (filters.ward && filters.ward !== 'all') {
    entries = entries.filter((l) => l.ward === filters.ward);
  }
  if (filters.patientId) {
    entries = entries.filter((l) => l.patientId === filters.patientId);
  }
  if (filters.status) {
    entries = entries.filter((l) => l.status === filters.status);
  }

  // Sort by timestamp descending (newest first)
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (filters.limit && typeof filters.limit === 'number') {
    entries = entries.slice(0, filters.limit);
  }

  return entries;
}

/**
 * Add a new patient record.
 * @param {object} patient
 * @returns {object}
 */
export function addPatient(patient) {
  if (!patient.id) {
    patient.id = 'pt-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  }
  if (!patient.token) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    patient.token = `VB-${rand}`;
  }
  if (!patient.registeredAt) {
    patient.registeredAt = new Date().toISOString();
  }
  if (!patient.status) {
    patient.status = 'registered';
  }

  state.patients.unshift(patient);
  saveState();
  return patient;
}

/**
 * Update the status of an existing order.
 * @param {string} orderId
 * @param {'pending'|'completed'} status
 * @returns {object|null}
 */
export function updateOrderStatus(orderId, status) {
  const order = state.orders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
    saveState();
    return order;
  }
  return null;
}

/**
 * Add a new medication order to a patient's chart (Doctor role).
 * @param {object} order - { patientId, medication, dosage, route, schedule, orderedBy, notes? }
 * @returns {object}
 */
export function addOrder(order) {
  if (!order.id) {
    order.id = 'ord-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  }
  if (!order.status) order.status = 'pending';
  order.orderState = 'active';
  if (!order.createdAt) order.createdAt = new Date().toISOString();
  if (!order.notes) order.notes = '';

  state.orders.unshift(order);
  saveState();
  return order;
}

/**
 * Discontinue an existing medication order (Doctor role).
 * @param {string} orderId
 * @param {string} reason
 * @returns {object|null}
 */
export function discontinueOrder(orderId, reason) {
  const order = state.orders.find((o) => o.id === orderId);
  if (order) {
    order.orderState = 'discontinued';
    order.discontinuedReason = reason || 'Physician Order Change';
    order.discontinuedAt = new Date().toISOString();
    saveState();
    return order;
  }
  return null;
}

/**
 * Add a new medication administration log record.
 * @param {object} entry
 * @returns {object}
 */
export function addLogEntry(entry) {
  if (!entry.id) {
    entry.id = 'log-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  }
  if (!entry.timestamp) {
    entry.timestamp = new Date().toISOString();
  }
  if (!entry.notes) {
    entry.notes = '';
  }

  state.logs.unshift(entry);
  saveState();
  return entry;
}

// Make accessible on window object for easy browser console verification
if (typeof window !== 'undefined') {
  window.VeriBandData = {
    seedData,
    loadState,
    saveState,
    resetState,
    getState,
    getPatientByToken,
    getPatientById,
    getPatients,
    getOrdersForPatient,
    getLogEntries,
    addPatient,
    updateOrderStatus,
    addOrder,
    discontinueOrder,
    addLogEntry
  };
}