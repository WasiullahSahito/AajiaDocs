import { z } from "zod";

export const MAX_TITLE_LENGTH = 200;
export const MAX_CONTENT_LENGTH = 1_000_000;

const title = z
  .string()
  .trim()
  .min(1, "Title can't be empty.")
  .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);

export const createDocumentSchema = z.object({ title: title.optional() });

export const updateDocumentSchema = z
  .object({
    title: title.optional(),
    content: z.string().max(MAX_CONTENT_LENGTH, "This document is too large to save (1 MB limit).").optional(),
  })
  .refine((d) => d.title !== undefined || d.content !== undefined, "Nothing to update.");

export const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["viewer", "editor"]).default("editor"),
});

export const loginSchema = z.object({ userId: z.string().min(1) });
