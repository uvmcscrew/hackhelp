import { render } from '@react-email/components';
import nodemailer from 'nodemailer';
import { MagicLinkEmail, type MagicLinkEmailProps } from './emails/magic-link';
import { serverEnv } from '$lib/env/server';
import { OTPEmail, type OTPEmailProps } from './emails/email-otp';

const transporter = nodemailer.createTransport(serverEnv.SMTP_URL, {
	logger: true
});

export async function sendMagicLinkEmail(to: string, emailProps: MagicLinkEmailProps) {
	return await transporter.sendMail({
		from: serverEnv.PUBLIC_SMTP_FROM,
		to,
		subject: 'Your HackHelp Login Link',
		html: await render(<MagicLinkEmail {...emailProps} />)
	});
}

export async function sendEmailOtp(to: string, emailProps: OTPEmailProps) {
	let title =
		emailProps.type === 'email-verification'
			? 'Email Verification Code'
			: emailProps.type === 'sign-in'
				? 'Sign-in Code'
				: 'Password Reset Code';
	return await transporter.sendMail({
		from: serverEnv.PUBLIC_SMTP_FROM,
		to,
		subject: `${title} | HackHelp`,
		html: await render(<OTPEmail {...emailProps} />)
	});
}
