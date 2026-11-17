// Activity 6: the medicine catalogue comes from the backend (GET /api/medicines, stored in the
// SQLite `medicines` table). It replaces the hardcoded list in src/data/medicines.js used in
// Activities 1-5. Prices are still illustrative samples, not verified DRAP records.
import { useEffect, useState } from 'react';
import { apiRequest } from './api.js';

// Compare like-for-like packs; a shared formula alone is insufficient.
export function comparisonKey(item) {
  return [item.formula, item.strength, item.form, item.pack].join('|');
}

// One request is shared by every component on the page. A successful response is kept for the
// rest of the session; a failed one is not, so opening the page again retries.
let catalog = null;
let inflight = null;

function loadCatalog() {
  if (!inflight) {
    inflight = apiRequest('/medicines').then(result => {
      if (result.ok && Array.isArray(result.data?.medicines)) {
        catalog = result.data.medicines;
        return { status: 'ready', medicines: catalog, message: '' };
      }
      inflight = null;
      return { status: 'error', medicines: [], message: result.message || 'The medicine list could not be loaded. Please try again.' };
    });
  }
  return inflight;
}

/** Returns { status: 'loading' | 'ready' | 'error', medicines, message }. */
export function useMedicines() {
  const [state, setState] = useState(() => (catalog
    ? { status: 'ready', medicines: catalog, message: '' }
    : { status: 'loading', medicines: [], message: '' }));

  useEffect(() => {
    if (catalog) return undefined;
    let active = true;
    loadCatalog().then(next => { if (active) setState(next); });
    return () => { active = false; };
  }, []);

  return state;
}
