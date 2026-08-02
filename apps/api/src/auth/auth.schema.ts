import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;

// Minimum length is a security control, not a business policy, so it is set
// here rather than treated as an owner decision. 12 characters is above the
// NIST floor and comfortably below the length of the generated bootstrap
// password, so it constrains nobody in practice.
const MIN_PASSWORD = 12;
const MAX_PASSWORD = 200;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(MIN_PASSWORD).max(MAX_PASSWORD),
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const changeEmailSchema = z.object({
  currentPassword: z.string().min(1),
  newEmail: z.string().trim().min(1).max(200).email(),
});

export type ChangeEmailDto = z.infer<typeof changeEmailSchema>;
