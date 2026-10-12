import { demoUsers } from '../data/demoUsers.js';
import { validateRequest } from './requestValidation.js';

export const STATUSES = Object.freeze(['Pending', 'Approved', 'Dispatched', 'Delivered']);
export const CATEGORIES = Object.freeze(['Painkiller', 'Antibiotic', 'Allergy', 'Stomach/Acid', 'Other']);

const demoPatient = demoUsers.find(user => user.role === 'patient');
const denied = () => ({ ok: false, message: 'Access Denied' });

function isPatient(session) {
  return session?.role === 'patient'
    && typeof session.id === 'string'
    && session.id.trim().length > 0
    && typeof session.name === 'string'
    && session.name.trim().length >= 3;
}

function sampleRequests() {
  // SECURITY: Fictional fixtures only; the owner comes from the existing demo account.
  return [
    { id: 'GM-1003', ownerId: demoPatient.id, patientName: demoPatient.name, medicine: 'Cetirizine', category: 'Allergy', quantity: 1, notes: '', date: '2026-10-03', status: 'Dispatched' },
    { id: 'GM-1002', ownerId: demoPatient.id, patientName: demoPatient.name, medicine: 'Omeprazole', category: 'Stomach/Acid', quantity: 2, notes: '', date: '2026-10-02', status: 'Approved' },
    { id: 'GM-1001', ownerId: demoPatient.id, patientName: demoPatient.name, medicine: 'Paracetamol', category: 'Painkiller', quantity: 1, notes: '', date: '2026-10-01', status: 'Delivered' },
  ];
}

let requests = sampleRequests();
let nextReference = 1004;

export function listOwnRequests(session) {
  // SECURITY: Check role before reading and return copies of only the session owner's records.
  if (!isPatient(session)) return denied();
  return {
    ok: true,
    requests: requests.filter(request => request.ownerId === session.id).map(request => ({ ...request })),
  };
}

export function getOwnRequest(session, id) {
  // SECURITY: Check ownership on lookup, not just on the list or visible links.
  if (!isPatient(session)) return denied();
  const request = requests.find(item => item.id === id && item.ownerId === session.id);
  if (!request) return { ok: false, message: 'Request not found' };
  return { ok: true, request: { ...request } };
}

export function addOwnRequest(session, fields) {
  // SECURITY: Repeat validation inside the action; callers cannot bypass it by skipping the form.
  if (!isPatient(session)) return denied();
  const validation = validateRequest(fields, CATEGORIES);
  if (!validation.ok) {
    return { ok: false, message: 'Please check the highlighted fields', errors: validation.errors };
  }
  if (requests.filter(request => request.ownerId === session.id).length >= 20) {
    return { ok: false, message: 'You can have at most 20 requests in this demo' };
  }

  // SECURITY: Explicitly select fields. Ignore supplied IDs, owners, patient names, dates and statuses.
  const request = {
    id: `GM-${nextReference++}`,
    ownerId: session.id,
    patientName: session.name.trim(),
    ...validation.values,
    date: new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date()),
    status: STATUSES[0],
  };
  requests = [request, ...requests];
  return { ok: true, request: { ...request }, message: `Request ${request.id} submitted successfully` };
}

export function resetRequestStore() {
  // SECURITY: Test-only lifecycle helper required by the shared contract; never exposed in the UI.
  // No session argument exists for this helper. All session-taking actions above enforce Patient role.
  requests = sampleRequests();
  nextReference = 1004;
  return { ok: true };
}
