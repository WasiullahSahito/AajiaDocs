import mammoth from "mammoth";
import { marked } from "marked";
import { HttpError } from "@/lib/errors";
import { sanitizeDocHtml } from "@/lib/sanitize";
import { MAX_TITLE_LENGTH } from "@/lib/validation";

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;
/** Vercel serverless functions reject request bodies over ~4.5 MB. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Blank lines become paragraph breaks; single newlines become <br>. */
export function textToHtml(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((para) => para.replace(/^\n+|\n+$/g, ""))
    .filter((para) => para.trim().length > 0)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(dot).toLowerCase() : "";
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return (base || "Imported document").slice(0, MAX_TITLE_LENGTH);
}

export async function convertFileToDocument(
  filename: string,
  data: Buffer,
): Promise<{ title: string; content: string }> {
  const ext = extensionOf(filename);
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new HttpError(400, "Unsupported file type. Upload a .txt, .md, or .docx file.");
  }
  if (data.length === 0) throw new HttpError(400, "The file is empty.");
  if (data.length > MAX_UPLOAD_BYTES) throw new HttpError(413, "The file is larger than 4 MB.");

  let html: string;
  if (ext === ".txt") {
    html = textToHtml(data.toString("utf8"));
  } else if (ext === ".md") {
    html = await marked.parse(data.toString("utf8"));
  } else {
    try {
      html = (await mammoth.convertToHtml({ buffer: data })).value;
    } catch {
      throw new HttpError(400, "This .docx file could not be read. Check that it is a valid Word document.");
    }
  }

  return { title: titleFromFilename(filename), content: sanitizeDocHtml(html) || "<p></p>" };
}
