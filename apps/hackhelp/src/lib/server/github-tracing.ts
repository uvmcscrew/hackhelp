import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Octokit } from 'octokit';

export function octokitTracingPlugin(octokit: Octokit) {
	const tracer = trace.getTracer('github-octokit');

	octokit.hook.wrap('request', async (request, options) => {
		const route = `${options.method.toUpperCase()} ${options.url}`;

		return tracer.startActiveSpan(`github.${route}`, async (span) => {
			span.setAttribute('http.method', options.method.toUpperCase());
			span.setAttribute('http.route', options.url);
			span.setAttribute('server.address', options.baseUrl ?? 'https://api.github.com');

			if (options.owner) span.setAttribute('github.owner', options.owner as string);
			if (options.repo) span.setAttribute('github.repo', options.repo as string);
			if (options.org) span.setAttribute('github.org', options.org as string);

			try {
				const response = await request(options);
				span.setAttribute('http.status_code', response.status);
				span.setStatus({ code: SpanStatusCode.OK });
				return response;
			} catch (error) {
				const err = error as { status?: number; message?: string };
				span.setAttribute('http.status_code', err.status ?? 500);
				span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
				span.recordException(error as Error);
				throw error;
			} finally {
				span.end();
			}
		});
	});
}
