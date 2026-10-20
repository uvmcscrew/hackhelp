import { z } from 'zod';

/**
 * Payload for sending a magic-link login email.
 * Mirrors MagicLinkEmailProps from @hackhelp/emails (JSON-safe primitives only).
 */
export const sendMagicLinkSchema = z.object({
	to: z.email(),
	magicLink: z.url(),
	username: z.string().optional(),
	fromIp: z.string().optional()
});
export type SendMagicLinkData = z.infer<typeof sendMagicLinkSchema>;

/**
 * Payload for sending an OTP code email.
 * Mirrors OTPEmailProps from @hackhelp/emails (JSON-safe primitives only).
 */
export const sendOtpSchema = z.object({
	to: z.email(),
	type: z.enum(['email-verification', 'sign-in', 'forget-password', 'change-email']),
	otp: z.string(),
	username: z.string().optional(),
	fromIp: z.string().optional()
});
export type SendOtpData = z.infer<typeof sendOtpSchema>;
