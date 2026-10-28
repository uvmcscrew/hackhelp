/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { defineRailway, postgres, redis, preserve, project, service, github } from 'railway/iac';

export default defineRailway((ctx) => {
	const db = postgres('Main DB');

	const kv = redis('KV');

	const web = service('HackHelp Web', {
		source: github('uvmcscrew/hackhelp', { branch: 'main', checkSuites: false }),
		build: {
			buildCommand:
				'bun --filter=hackhelp run prod:build',
			buildEnvironment: 'V3',
			builder: 'RAILPACK',
			watchPatterns: ['apps/hackhelp/**', '.railway/railway.ts']
		},
		start: 'bun --cwd apps/hackhelp build/index.js',
		preDeploy: 'bun --filter=@hackhelp/db run db:migrate',
		healthcheck: '/api/health',

		replicas: { 'us-east4-eqdc4a': 1 },
		deploy: { limitOverride: { containers: { cpu: 4, memoryBytes: 6000000000 } } },
		// domains: [{ domain: 'hackhelp.uvm.lol', port: 3000 }],
		tracing: { enabled: true },
		env: {
			DATABASE_URL: db.env.DATABASE_URL,
			REDIS_URL: kv.env.REDIS_URL,
			AUTH_SECRET: preserve(),
			BASE_URL: 'https://hackhelp.uvm.lol',
			GITHUB_APP_ID: ctx.shared.GITHUB_APP_ID,
			GITHUB_APP_PRIVATE_KEY: ctx.shared.GITHUB_APP_PRIVATE_KEY,
			GITHUB_APP_CLIENT_ID: ctx.shared.GITHUB_APP_CLIENT_ID,
			GITHUB_APP_CLIENT_SECRET: ctx.shared.GITHUB_APP_CLIENT_SECRET,
			GITHUB_WEBHOOK_SECRET: ctx.shared.GITHUB_WEBHOOK_SECRET,
			SMTP_URL: ctx.shared.SMTP_URL,
			UVM_NETID_OIDC_CLIENT_ID: ctx.shared.UVM_NETID_OIDC_CLIENT_ID,
			UVM_NETID_OIDC_CLIENT_SECRET: ctx.shared.UVM_NETID_OIDC_CLIENT_SECRET,
			UVM_NETID_OIDC_DISCOVERY_URL: ctx.shared.UVM_NETID_OIDC_DISCOVERY_URL,
			PUBLIC_GITHUB_ORGNAME: 'UVMHacks2026',
			PUBLIC_SMTP_FROM: 'noreply@hackhelp.uvm.lol'
		}
  });

	const worker = service('HackHelp BullMQ Worker', {
		source: github('uvmcscrew/hackhelp', { branch: 'main', checkSuites: false }),
		build: {
			buildCommand:
				'bun install',
			buildEnvironment: 'V3',
			builder: 'RAILPACK',
			watchPatterns: ['apps/worker/**', '.railway/railway.ts']
		},
		start: 'bun --cwd apps/worker index.ts',
		preDeploy: 'bun --filter=@hackhelp/db run db:migrate',
		replicas: { 'us-east4-eqdc4a': 1 },
		deploy: { limitOverride: { containers: { cpu: 2, memoryBytes: 4000000000 } } },
		tracing: { enabled: true },
		env: {
			DATABASE_URL: db.env.DATABASE_URL,
			REDIS_URL: kv.env.REDIS_URL,
			GITHUB_APP_ID: ctx.shared.GITHUB_APP_ID,
			GITHUB_APP_PRIVATE_KEY: ctx.shared.GITHUB_APP_PRIVATE_KEY,
			GITHUB_APP_CLIENT_ID: ctx.shared.GITHUB_APP_CLIENT_ID,
			GITHUB_APP_CLIENT_SECRET: ctx.shared.GITHUB_APP_CLIENT_SECRET,
			GITHUB_WEBHOOK_SECRET: ctx.shared.GITHUB_WEBHOOK_SECRET,
			SMTP_URL: ctx.shared.SMTP_URL,
			PUBLIC_GITHUB_ORGNAME: 'UVMHacks2026',
			SMTP_FROM: 'noreply@hackhelp.uvm.lol'
		}
	});

	return project('hackhelp', {
		// @ts-expect-error This is not typed in the railway SDK yet?
		variables: { managed: true },
		resources: [web, db, kv, worker]
	});
});
