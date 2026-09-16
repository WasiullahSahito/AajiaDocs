import { describe, expect, it } from "vitest";
import { HttpError } from "@/lib/errors";
import { convertFileToDocument, textToHtml, titleFromFilename } from "@/lib/import";
import { sanitizeDocHtml } from "@/lib/sanitize";

describe("textToHtml", () => {
  it("turns blank-line-separated blocks into paragraphs and escapes HTML", () => {
    expect(textToHtml("Hello <b>world</b>\nsecond line\r\n\r\nNext para")).toBe(
      "<p>Hello &lt;b&gt;world&lt;/b&gt;<br>second line</p><p>Next para</p>",
    );
  });
});

describe("convertFileToDocument", () => {
  it("converts markdown structure into editor-supported HTML", async () => {
    const md = "# Plan\n\nSome **bold** and _italic_ text.\n\n- one\n- two\n\n1. first\n\n##### Deep heading";
    const { title, content } = await convertFileToDocument("q3_plan.md", Buffer.from(md));
    expect(title).toBe("q3 plan");
    expect(content).toContain("<h1>Plan</h1>");
    expect(content).toContain("<strong>bold</strong>");
    expect(content).toContain("<em>italic</em>");
    expect(content).toMatch(/<ul>\s*<li>one<\/li>/);
    expect(content).toMatch(/<ol>\s*<li>first<\/li>/);
    expect(content).toContain("<h3>Deep heading</h3>");
  });

  it("strips scripts and dangerous attributes from imported content", async () => {
    const md = 'Hi <script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:x">link</a>';
    const { content } = await convertFileToDocument("evil.md", Buffer.from(md));
    expect(content).not.toMatch(/script|onerror|img|javascript|<a/i);
    expect(content).toContain("link");
  });

  it("rejects unsupported, empty, and corrupt files with 400-level errors", async () => {
    await expect(convertFileToDocument("photo.png", Buffer.from("x"))).rejects.toMatchObject({ status: 400 });
    await expect(convertFileToDocument("empty.txt", Buffer.alloc(0))).rejects.toMatchObject({ status: 400 });
    await expect(convertFileToDocument("broken.docx", Buffer.from("not a zip"))).rejects.toBeInstanceOf(HttpError);
  });
});

describe("sanitizeDocHtml / titleFromFilename", () => {
  it("keeps formatting the editor supports", () => {
    const html = "<h2>T</h2><p><strong>b</strong><em>i</em><u>u</u></p><ol><li><p>x</p></li></ol>";
    expect(sanitizeDocHtml(html)).toBe(html);
  });

  it("falls back to a default title", () => {
    expect(titleFromFilename(".md")).toBe("Imported document");
  });
});
