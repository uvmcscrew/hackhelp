import { SMTP_URL } from '$app/env/private';
import { PUBLIC_SMTP_FROM } from '$app/env/public';
import { createEmailClient } from '@hackhelp/emails';

export const emailClient = createEmailClient({
	smtpUrl: SMTP_URL,
	from: PUBLIC_SMTP_FROM
});

export const testSMTPConnection = emailClient.testSMTPConnection;
export const sendMagicLinkEmail = emailClient.sendMagicLinkEmail;
export const sendEmailOtp = emailClient.sendEmailOtp;
