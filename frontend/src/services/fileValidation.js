// Activity 5 Task 3 (Ammar Ahmad): reusable client-side checks for the optional
// supporting document on the Submit Medicine Request form.
// SECURITY: Client-side validation is only an initial screen. It cannot prove that a file is
// safe or that its contents match its name, and browser code can be modified. A real upload
// must be re-checked, scanned and stored securely by the backend.

export const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_FILE_NAME = 100;
export const ALLOWED_FILE_TYPES = Object.freeze({
  pdf: Object.freeze(['application/pdf']),
  jpg: Object.freeze(['image/jpeg']),
  jpeg: Object.freeze(['image/jpeg']),
  png: Object.freeze(['image/png']),
});
// The accept attribute only filters the file picker; users can still choose "All files".
export const ACCEPT_ATTRIBUTE = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileExtension(name) {
  if (typeof name !== 'string') return '';
  const dot = name.lastIndexOf('.');
  // SECURITY: The LAST extension decides, so "prescription.pdf.exe" is treated as .exe.
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : '';
}

// Checks what the browser reports about the file: name, extension, size and MIME type.
export function validateFileMeta(file) {
  if (!file || typeof file !== 'object' || typeof file.name !== 'string' || !file.name.trim()) {
    return { ok: false, error: 'Choose a file.' };
  }
  const { name, size, type } = file;
  // eslint-disable-next-line no-control-regex
  if (name.length > MAX_FILE_NAME || /[\u0000-\u001f\u007f/\\]/.test(name)) {
    return { ok: false, error: `File name must be ${MAX_FILE_NAME} characters or fewer with no path or control characters.` };
  }
  const extension = fileExtension(name);
  if (!Object.hasOwn(ALLOWED_FILE_TYPES, extension)) {
    const shown = extension ? `.${extension}` : 'files without an extension';
    return { ok: false, error: `Unsupported file type (${shown}). Allowed types: PDF, JPG, JPEG or PNG.` };
  }
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: 'The selected file is empty.' };
  if (size > MAX_FILE_BYTES) {
    return { ok: false, error: `File is too large (${formatBytes(size)}). Maximum size is ${formatBytes(MAX_FILE_BYTES)}.` };
  }
  // Browsers report an empty type for unknown files; the content check below then decides.
  if (typeof type !== 'string' || (type && !ALLOWED_FILE_TYPES[extension].includes(type))) {
    return { ok: false, error: `The file's reported type does not match its .${extension} extension.` };
  }
  return { ok: true, extension };
}

// Compatibility API from PR #7 (Muhammad Aamir), kept on top of the stricter checks above.
export const MAX_SUPPORTING_FILE_SIZE = MAX_FILE_BYTES;
export const ALLOWED_SUPPORTING_EXTENSIONS = Object.freeze(Object.keys(ALLOWED_FILE_TYPES).map(extension => `.${extension}`));

/** Synchronous name/size/type screening. Returns { ok, fileName } or { ok: false, message }. */
export function validateSupportingFile(file) {
  // A missing type is treated like the empty type browsers report for unknown files.
  const meta = validateFileMeta(file && typeof file === 'object' ? { name: file.name, size: file.size, type: file.type ?? '' } : file);
  return meta.ok ? { ok: true, fileName: file.name.trim() } : { ok: false, message: meta.error };
}

// First bytes ("magic numbers") of each allowed format.
const SIGNATURES = Object.freeze({
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
});

export function matchesSignature(bytes, extension) {
  const expected = SIGNATURES[extension];
  if (!expected || !bytes || typeof bytes.length !== 'number' || bytes.length < expected.length) return false;
  return expected.every((byte, index) => bytes[index] === byte);
}

// Full check for a browser File: metadata first, then only the first 8 bytes are read to
// confirm the format. File contents are never previewed, kept or stored.
export async function validateSelectedFile(file) {
  const meta = validateFileMeta(file);
  if (!meta.ok) return meta;
  try {
    const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    if (!matchesSignature(header, meta.extension)) {
      return { ok: false, error: `File content is not a real ${meta.extension.toUpperCase()} file. It may have been renamed.` };
    }
  } catch {
    return { ok: false, error: 'The file could not be read. Choose it again.' };
  }
  return { ok: true, extension: meta.extension };
}
