import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: {},
	AUTH_SECRET: {},
	BASE_URL: {},
	GITHUB_APP_ID: {},
	GITHUB_APP_PRIVATE_KEY: {},
	GITHUB_APP_CLIENT_ID: {},
	GITHUB_APP_CLIENT_SECRET: {},
	GITHUB_WEBHOOK_SECRET: {},
	SMTP_URL: {},
	UVM_NETID_OIDC_CLIENT_ID: {},
	UVM_NETID_OIDC_CLIENT_SECRET: {},
	UVM_NETID_OIDC_DISCOVERY_URL: {},
	PUBLIC_GITHUB_ORGNAME: { public: true },
	PUBLIC_SMTP_FROM: { public: true },
});
