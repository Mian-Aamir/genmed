// Module 2 (Ammar Ahmad): submit, view and track medicine requests.
import { Router } from 'express';
import { HttpError } from '../errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  formatReference, parseReference, validateMedicineRequest, validateRequestStatus,
} from '../validation.js';

const MAX_REQUESTS_PER_PATIENT = 20;

function todayInPakistan() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export function requestRoutes(db) {
  const router = Router();
  router.use(requireAuth(db));

  const columns = `r.id, r.medicine, r.category, r.quantity, r.notes, r.status, r.request_date, u.name AS patient_name`;
  // SECURITY: Every query is parameterized and patient queries are scoped by owner_id = ?.
  const listOwn = db.prepare(`SELECT ${columns} FROM medicine_requests r JOIN users u ON u.id = r.owner_id
    WHERE r.owner_id = ? ORDER BY r.id DESC`);
  const listAll = db.prepare(`SELECT ${columns} FROM medicine_requests r JOIN users u ON u.id = r.owner_id
    ORDER BY r.id DESC`);
  const getOwn = db.prepare(`SELECT ${columns} FROM medicine_requests r JOIN users u ON u.id = r.owner_id
    WHERE r.id = ? AND r.owner_id = ?`);
  const getAny = db.prepare(`SELECT ${columns} FROM medicine_requests r JOIN users u ON u.id = r.owner_id
    WHERE r.id = ?`);
  const countOwn = db.prepare('SELECT COUNT(*) AS n FROM medicine_requests WHERE owner_id = ?');
  const insert = db.prepare(`INSERT INTO medicine_requests (owner_id, medicine, category, quantity, notes, request_date)
    VALUES (?, ?, ?, ?, ?, ?)`);
  const updateStatus = db.prepare('UPDATE medicine_requests SET status = ? WHERE id = ?');

  const toDto = row => ({
    id: formatReference(row.id),
    patientName: row.patient_name,
    medicine: row.medicine,
    category: row.category,
    quantity: row.quantity,
    notes: row.notes,
    date: row.request_date,
    status: row.status,
  });

  // GET /api/requests  (patient: own requests; doctor: all requests)
  router.get('/', requireRole('patient', 'doctor'), (req, res) => {
    const rows = req.user.role === 'doctor' ? listAll.all() : listOwn.all(req.user.id);
    res.json({ ok: true, requests: rows.map(toDto) });
  });

  // GET /api/requests/:reference  e.g. /api/requests/GM-1002
  router.get('/:reference', requireRole('patient', 'doctor'), (req, res) => {
    const id = parseReference(req.params.reference);
    // SECURITY: Ownership is checked in the lookup itself. Another patient's reference returns
    // the same 404 as a missing one, so references cannot be probed.
    const row = id && (req.user.role === 'doctor' ? getAny.get(id) : getOwn.get(id, req.user.id));
    if (!row) throw new HttpError(404, 'Request not found');
    res.json({ ok: true, request: toDto(row) });
  });

  // POST /api/requests  { medicine, category, quantity, notes }  (patient only)
  router.post('/', requireRole('patient'), (req, res) => {
    const { ok, errors, values } = validateMedicineRequest(req.body);
    if (!ok) throw new HttpError(400, 'Please check the highlighted fields', errors);
    if (countOwn.get(req.user.id).n >= MAX_REQUESTS_PER_PATIENT) {
      throw new HttpError(409, `You can have at most ${MAX_REQUESTS_PER_PATIENT} requests`);
    }
    // SECURITY: Owner, patient name, date and status are set by the server. Any id, ownerId,
    // status or date fields in the body are ignored.
    const id = Number(insert.run(req.user.id, values.medicine, values.category, values.quantity, values.notes, todayInPakistan()).lastInsertRowid);
    const request = toDto(getOwn.get(id, req.user.id));
    res.status(201).json({ ok: true, request, message: `Request ${request.id} submitted successfully` });
  });

  // PATCH /api/requests/:reference/status  { status }  (doctor only: role-based authorization)
  router.patch('/:reference/status', requireRole('doctor'), (req, res) => {
    const id = parseReference(req.params.reference);
    if (!id || !getAny.get(id)) throw new HttpError(404, 'Request not found');
    const { ok, errors, values } = validateRequestStatus(req.body);
    if (!ok) throw new HttpError(400, 'Choose a valid status.', errors);
    updateStatus.run(values.status, id);
    res.json({ ok: true, request: toDto(getAny.get(id)), message: `Status updated to ${values.status}` });
  });

  return router;
}
