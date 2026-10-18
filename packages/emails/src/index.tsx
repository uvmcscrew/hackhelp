import { render } from '@react-email/components';
import nodemailer from 'nodemailer';
import { MagicLinkEmail, type MagicLinkEmailProps } from './emails/magic-link';
import { OTPEmail, type OTPEmailProps } from './emails/email-otp';

export type EmailClientConfig = {
	smtpUrl: string;
	from: string;
};

export function createEmailClient({ smtpUrl, from }: EmailClientConfig) {
	const transporter = nodemailer.createTransport(smtpUrl);

	return {
		transporter,
		async testSMTPConnection() {
			try {
				await transporter.verify();
				return true;
			} catch (e) {
				console.log('Failed to connect to SMTP Server');
				console.error(e);
				return false;
			}
		},
		async sendMagicLinkEmail(to: string, emailProps: MagicLinkEmailProps) {
			console.log('Sending Magic Link email to', to);
			const mail = await transporter.sendMail({
				from,
				to,
				subject: 'Your HackHelp Login Link',
				html: await render(<MagicLinkEmail {...emailProps} />)
			});
			console.log(mail);
		},
		async sendEmailOtp(to: string, emailProps: OTPEmailProps) {
			const title =
				emailProps.type === 'email-verification'
					? 'Email Verification Code'
					: emailProps.type === 'sign-in'
						? 'Sign-in Code'
						: 'Password Reset Code';
			console.log('Sending OTP email to', to);
			const mail = await transporter.sendMail({
				from,
				to,
				subject: `${title} | HackHelp`,
				html: await render(<OTPEmail {...emailProps} />)
			});
			console.log(mail);
		}
	};
}

export type EmailClient = ReturnType<typeof createEmailClient>;
export { MagicLinkEmail, OTPEmail };
export type { MagicLinkEmailProps, OTPEmailProps };
