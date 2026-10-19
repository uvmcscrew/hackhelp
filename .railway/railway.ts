import { defineRailway, postgres, preserve, project, service } from 'railway/iac';

export default defineRailway(() => {
	const db = postgres('postgres');

	const web = service('hackhelp', {
		build:
			'bun install && bun --cwd apps/hackhelp svelte-kit sync && bun --cwd apps/hackhelp --bun run build',
		start: 'bun --cwd apps/hackhelp build/index.js',
		preDeploy: 'bun --cwd packages/db run db:migrate',
		healthcheck: '/api/health',
		env: {
			DATABASE_URL: db.env.DATABASE_URL,
			AUTH_SECRET: preserve(),
			BASE_URL: preserve(),
			GITHUB_APP_ID: preserve(),
			GITHUB_APP_PRIVATE_KEY: preserve(),
			GITHUB_APP_CLIENT_ID: preserve(),
			GITHUB_APP_CLIENT_SECRET: preserve(),
			GITHUB_WEBHOOK_SECRET: preserve(),
			SMTP_URL: preserve(),
			UVM_NETID_OIDC_CLIENT_ID: preserve(),
			UVM_NETID_OIDC_CLIENT_SECRET: preserve(),
			UVM_NETID_OIDC_DISCOVERY_URL: preserve(),
			MLH_OAUTH_CLIENT_ID: preserve(),
			MLH_OAUTH_CLIENT_SECRET: preserve(),
			PUBLIC_GITHUB_ORGNAME: 'UVMHacks2026',
			PUBLIC_SMTP_FROM: preserve(),
			PUBLIC_SHOW_CHALLENGES: preserve()
		}
	});

	return project('hackhelp', {
		resources: [web, db]
	});
});
