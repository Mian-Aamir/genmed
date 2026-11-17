export const MAX_SUPPORTING_FILE_SIZE = 2 * 1024 * 1024;
export const ALLOWED_SUPPORTING_EXTENSIONS = Object.freeze(['.pdf', '.jpg', '.jpeg', '.png']);

export function validateSupportingFile(file) {
  // SECURITY: This is client-side screening only. A backend must inspect uploads before storing them.
  if (!file || typeof file.name !== 'string' || !Number.isFinite(file.size)) {
    return { ok: false, message: 'Choose a file to validate.' };
  }
  const fileName = file.name.trim();
  const extension = fileName.includes('.') ? `.${fileName.split('.').pop().toLowerCase()}` : '';
  if (!ALLOWED_SUPPORTING_EXTENSIONS.includes(extension)) {
    return { ok: false, message: 'Choose a PDF, JPG, JPEG or PNG file.' };
  }
  if (file.size > MAX_SUPPORTING_FILE_SIZE) {
    return { ok: false, message: 'Choose a file smaller than or equal to 2 MB.' };
  }
  return { ok: true, fileName };
}
