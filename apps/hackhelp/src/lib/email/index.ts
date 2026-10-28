import { REDIS_URL } from '$app/env/private';
import { buildConnection, configureQueue, dispatch } from '@hackhelp/queue';
import type { MagicLinkEmailProps, OTPEmailProps } from '@hackhelp/emails';

const connection = buildConnection(REDIS_URL);
configureQueue({ connection });

export async function sendMagicLinkEmail(to: string, emailProps: MagicLinkEmailProps) {
	await dispatch('emails', 'send-magic-link', {
		to,
		magicLink: emailProps.magicLink,
		username: emailProps.username,
		fromIp: emailProps.fromIp
	});
}

export async function sendEmailOtp(to: string, emailProps: OTPEmailProps) {
	await dispatch('emails', 'send-otp', {
		to,
		type: emailProps.type,
		otp: emailProps.otp,
		username: emailProps.username,
		fromIp: emailProps.fromIp
	});
}
