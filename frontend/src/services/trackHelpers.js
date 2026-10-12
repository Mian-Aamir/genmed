import { STATUSES } from './requestStore.js';

export const MAX_REFERENCE_LENGTH = 20;

export function normaliseReference(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

export function isValidReferenceQuery(value) {
  // SECURITY: Reject invalid types and oversized input rather than silently matching all records.
  if (typeof value !== 'string' || value.length > MAX_REFERENCE_LENGTH) return false;
  // Empty search and prefixes of GM-#### are valid while typing.
  return /^(?:G|GM|GM-\d{0,4})?$/.test(normaliseReference(value));
}

export function isValidStatus(value) {
  // SECURITY: Accept only the exact allowlisted values, not arbitrary dropdown input.
  return value === 'All' || STATUSES.includes(value);
}

export function filterRequests(requests, query = '', status = 'All') {
  // SECURITY: Filtering is not authorization. Callers must first use listOwnRequests(session).
  if (!Array.isArray(requests) || !isValidReferenceQuery(query) || !isValidStatus(status)) return [];
  const reference = normaliseReference(query);
  return requests.filter(request => (
    request.id.startsWith(reference) && (status === 'All' || request.status === status)
  ));
}
