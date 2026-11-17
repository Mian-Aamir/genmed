import { useRef, useState } from 'react';
import { ACCEPT_ATTRIBUTE, MAX_FILE_BYTES, formatBytes, validateSelectedFile } from '../services/fileValidation';

// Activity 5 Task 3 (Ammar Ahmad): optional supporting document for a medicine request.
// SECURITY: These checks are only an initial client-side screen and do not make a file safe.
// No preview is shown and nothing is uploaded, read beyond its first 8 bytes, or saved to
// localStorage/sessionStorage. Only the name and size of an accepted file are kept, in memory.
export default function SecureFileSelection({ id = 'supporting-document' }) {
  const input = useRef(null);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  function clearInput() {
    if (input.current) input.current.value = '';
  }

  async function choose(event) {
    const file = event.target.files?.[0];
    setSelected(null);
    setStatus(null);
    if (!file) return;
    setChecking(true);
    const result = await validateSelectedFile(file);
    setChecking(false);
    if (!result.ok) {
      // SECURITY: Reject in the interface: the unsupported file is removed from the input.
      clearInput();
      setStatus({ ok: false, message: result.error });
      return;
    }
    setSelected({ name: file.name, size: file.size });
    setStatus({ ok: true, message: 'File checked. Uploading documents is not available yet, so it will not be sent.' });
  }

  function remove() {
    clearInput();
    setSelected(null);
    setStatus(null);
    input.current?.focus();
  }

  return (
    <div className="field secure-file">
      <label htmlFor={id}>Supporting document (optional)</label>
      {/* No name attribute: the file is never part of the submitted request. */}
      <input ref={input} id={id} type="file" accept={ACCEPT_ATTRIBUTE} onChange={choose}
        aria-invalid={status?.ok === false} aria-describedby={`${id}-hint ${id}-status`} />
      <span id={`${id}-hint`} className="field-hint">
        PDF, JPG, JPEG or PNG, up to {formatBytes(MAX_FILE_BYTES)}. Checked in your browser; uploads are not enabled yet.
      </span>
      <div id={`${id}-status`} role="status" aria-live="polite">
        {checking && <p className="field-hint">Checking file…</p>}
        {selected && (
          <p className="secure-file-selected">
            {/* SECURITY: The file name is user-controlled, so it is rendered as React text only. */}
            <strong>{selected.name}</strong> · {formatBytes(selected.size)}
            <button type="button" className="button secondary small" onClick={remove}>Remove</button>
          </p>
        )}
        {status && <p className={status.ok ? 'secure-file-ok' : 'field-error'}>{status.message}</p>}
      </div>
    </div>
  );
}
