import { z } from "zod";

// Early feedback only: the API applies the same rules (and more) and is authoritative.
export const email = z.string().trim().min(1, "Enter your email.").max(256).email("Enter a valid email address.");
export const password = z.string().min(5, "Use at least 5 characters.").max(128, "Use at most 128 characters.");

export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password.") });

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  email,
  password,
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match." });

export const forgotSchema = z.object({ email });

export const resetSchema = z.object({
  email,
  token: z.string().min(1),
  password,
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match." });

/** The emailed one-time code: digits only (spaces are ignored, so a pasted "123 456" works). */
export const codeSchema = z.object({
  code: z.string().transform((v) => v.replace(/\s+/g, "")).pipe(z.string().regex(/^\d{4,8}$/, "Enter the 6-digit code from the email.")),
});
