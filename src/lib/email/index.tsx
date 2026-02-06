import { render } from '@react-email/components';
import nodemailer from 'nodemailer';
import { MagicLinkEmail, type MagicLinkEmailProps } from './emails/magic-link';
import { serverEnv } from '$lib/env/server';
import { OTPEmail, type OTPEmailProps } from './emails/email-otp';

const transporter = nodemailer.createTransport(serverEnv.SMTP_URL, {
	logger: true
});

export async function testSMTPConnection() {
	try {
		await transporter.verify();
		return true;
	} catch (e) {
		console.log('Failed to connect to SMTP Server');
		console.error(e);
		return false;
	}
}

export async function sendMagicLinkEmail(to: string, emailProps: MagicLinkEmailProps) {
	console.log('Sending Magic Link email to', to);
	const mail = await transporter.sendMail({
		from: serverEnv.PUBLIC_SMTP_FROM,
		to,
		subject: 'Your HackHelp Login Link',
		html: await render(<MagicLinkEmail {...emailProps} />)
	});
	console.log(mail);
}

export async function sendEmailOtp(to: string, emailProps: OTPEmailProps) {
	let title =
		emailProps.type === 'email-verification'
			? 'Email Verification Code'
			: emailProps.type === 'sign-in'
				? 'Sign-in Code'
				: 'Password Reset Code';
	console.log('Sending OTP email to', to);
	const mail = await transporter.sendMail({
		from: serverEnv.PUBLIC_SMTP_FROM,
		to,
		subject: `${title} | HackHelp`,
		html: await render(<OTPEmail {...emailProps} />)
	});
	console.log(mail);
}
