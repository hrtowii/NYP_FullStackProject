import { z } from "zod";
import validator from "validator";
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .refine(
    (val) => /[A-Z]/.test(val),
    "Password must contain at least one uppercase letter",
  )
  .refine(
    (val) => /[a-z]/.test(val),
    "Password must contain at least one lowercase letter",
  )
  .refine((val) => /\d/.test(val), "Password must contain at least one number")
  .refine(
    (val) => /[!@#$%^&*(),.?":{}|<>]/.test(val),
    "Password must contain at least one special character",
  );