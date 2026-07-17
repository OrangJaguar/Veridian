import mammoth from 'mammoth';

export const MAX_DOCX_BYTES = 20 * 1024 * 1024;

/**
 * Extract plain text from a .docx File.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromDocx(file) {
  if (file.size > MAX_DOCX_BYTES) {
    throw new Error(`${file.name} exceeds 20MB limit.`);
  }

  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  const text = (result.value ?? '').replace(/\s+/g, ' ').trim();

  if (!text) {
    throw new Error(
      `${file.name} doesn't appear to contain readable text. Try a different file or paste your notes directly.`,
    );
  }

  return text;
}
