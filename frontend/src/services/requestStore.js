// Module 2 shared constants. Activity 6: the in-memory request store was replaced by the
// backend API (GET/POST /api/requests, GET /api/requests/:reference). The server enforces the
// same categories and statuses in backend/src/validation.js and in the database schema.
export const STATUSES = Object.freeze(['Pending', 'Approved', 'Dispatched', 'Delivered']);
export const CATEGORIES = Object.freeze(['Painkiller', 'Antibiotic', 'Allergy', 'Stomach/Acid', 'Other']);
