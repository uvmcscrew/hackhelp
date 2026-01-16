import { render } from '@react-email/components';
import nodemailer from 'nodemailer';
import { MagicLinkEmail, type MagicLinkEmailProps } from './emails/magic-link';
import { serverEnv } from '$lib/env/server';

const transporter = nodemailer.createTransport(serverEnv.SMTP_URL);

export async function sendMagicLinkEmail(to: string, emailProps: MagicLinkEmailProps) {
	return await transporter.sendMail({
		from: serverEnv.SMTP_FROM,
		to,
		subject: 'Your HackHelp Login Link',
		html: await render(<MagicLinkEmail {...emailProps} />)
	});
}
