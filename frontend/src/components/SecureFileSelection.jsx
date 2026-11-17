import { useState } from 'react';
import { validateSupportingFile } from '../services/fileValidation';

export default function SecureFileSelection() {
  const [selectedName, setSelectedName] = useState('');
  const [error, setError] = useState('');

  function changeFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = validateSupportingFile(file);
    // SECURITY: Keep only a validated filename for UI feedback. Do not upload, preview or store the file.
    if (!result.ok) {
      setSelectedName('');
      setError(result.message);
      event.target.value = '';
      return;
    }
    setSelectedName(result.fileName);
    setError('');
  }

  return (
    <div className="field supporting-file-field">
      <label htmlFor="supporting-file">Supporting document (optional)</label>
      <input id="supporting-file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={changeFile} aria-invalid={Boolean(error)} aria-describedby="supporting-file-help supporting-file-error" />
      <span id="supporting-file-help" className="field-hint">PDF, JPG, JPEG or PNG up to 2 MB. Demo only: no file is uploaded or stored.</span>
      <span id="supporting-file-error" className="field-error" role="alert">{error}</span>
      {selectedName && <span className="file-selected">Selected: {selectedName}</span>}
    </div>
  );
}
