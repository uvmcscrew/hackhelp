import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  BASE_URL: {},
  DATABASE_URL: {},
  GITHUB_APP_ID: {},
	GITHUB_APP_PRIVATE_KEY: {},
	GITHUB_APP_CLIENT_ID: {},
	GITHUB_APP_CLIENT_SECRET: {},
  GITHUB_WEBHOOK_SECRET: {},
  PUBLIC_GITHUB_ORGNAME: { public: true },
 	PUBLIC_SMTP_FROM: { public: true },
	REDIS_URL: {},
	AUTH_SECRET: {},
	UVM_NETID_OIDC_CLIENT_ID: {},
	UVM_NETID_OIDC_CLIENT_SECRET: {},
	UVM_NETID_OIDC_DISCOVERY_URL: {},
});
