// Module 1 (Muhammad Aamir): medicine review requests.
// Patients request a review of a sample medicine; doctors record a decision and an internal note.
import { Router } from 'express';
import { HttpError } from '../errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { parseId, validateMedicineId, validateReviewDecision } from '../validation.js';

const MAX_REVIEWS_PER_PATIENT = 20;

function maskEmail(email) {
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
}

export function reviewRoutes(db) {
  const router = Router();
  router.use(requireAuth(db));

  const listForPatient = db.prepare(`SELECT id, medicine_id, status, created_at FROM review_requests
    WHERE patient_id = ? ORDER BY id`);
  const listAll = db.prepare(`SELECT r.id, r.medicine_id, r.status, r.internal_note, r.created_at, r.patient_id, u.email
    FROM review_requests r JOIN users u ON u.id = r.patient_id ORDER BY r.id`);
  const medicineExists = db.prepare('SELECT 1 FROM medicines WHERE id = ?');
  const countForPatient = db.prepare('SELECT COUNT(*) AS n FROM review_requests WHERE patient_id = ?');
  const pendingDuplicate = db.prepare(`SELECT 1 FROM review_requests
    WHERE patient_id = ? AND medicine_id = ? AND status = 'pending'`);
  const insert = db.prepare('INSERT INTO review_requests (patient_id, medicine_id) VALUES (?, ?)');
  const findById = db.prepare('SELECT id, status FROM review_requests WHERE id = ?');
  const decide = db.prepare(`UPDATE review_requests
    SET status = ?, internal_note = ?, reviewed_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ? AND status = 'pending'`);

  const toCommon = row => ({ id: row.id, reference: `REQ-${String(row.id).padStart(3, '0')}`, medicineId: row.medicine_id, status: row.status, createdAt: row.created_at });

  // GET /api/reviews  (patient: own requests only, no internal notes; doctor: all, masked contact)
  router.get('/', requireRole('patient', 'doctor'), (req, res) => {
    // SECURITY: Ownership filter and explicit field selection are enforced in SQL on the server.
    const requests = req.user.role === 'doctor'
      ? listAll.all().map(row => ({
        ...toCommon(row),
        patientReference: `patient-${row.patient_id}`,
        maskedEmail: maskEmail(row.email),
        internalNote: row.internal_note,
      }))
      : listForPatient.all(req.user.id).map(toCommon);
    res.json({ ok: true, requests });
  });

  // POST /api/reviews  { medicineId }  (patient only)
  router.post('/', requireRole('patient'), (req, res) => {
    const { ok, errors, values } = validateMedicineId(req.body);
    if (!ok || !medicineExists.get(values.medicineId)) {
      throw new HttpError(400, 'Choose a medicine from the sample list.', ok ? undefined : errors);
    }
    // SECURITY: The owner is always the authenticated user, never a value from the request body.
    if (pendingDuplicate.get(req.user.id, values.medicineId)) {
      throw new HttpError(409, 'You already have a pending request for this medicine.');
    }
    if (countForPatient.get(req.user.id).n >= MAX_REVIEWS_PER_PATIENT) {
      throw new HttpError(409, `The demo limit is ${MAX_REVIEWS_PER_PATIENT} requests per patient.`);
    }
    const id = Number(insert.run(req.user.id, values.medicineId).lastInsertRowid);
    res.status(201).json({ ok: true, id, message: 'Review request submitted.' });
  });

  // PATCH /api/reviews/:id  { decision, note }  (doctor only: role-based authorization)
  router.patch('/:id', requireRole('doctor'), (req, res) => {
    const id = parseId(req.params.id);
    const existing = id ? findById.get(id) : undefined;
    if (!existing) throw new HttpError(404, 'Request not found.');
    const { ok, errors, values } = validateReviewDecision(req.body);
    if (!ok) throw new HttpError(400, 'Please check the highlighted fields.', errors);
    if (existing.status !== 'pending') throw new HttpError(409, 'This request has already been reviewed.');
    const changed = decide.run(values.decision, values.note, req.user.id, id).changes;
    if (!changed) throw new HttpError(409, 'This request has already been reviewed.');
    res.json({ ok: true, message: 'Decision saved. This is not medical approval.' });
  });

  return router;
}
