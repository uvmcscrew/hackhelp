import type { PageLoadEvent } from './$types';

export function load({ params }: PageLoadEvent) {
	return { teamId: params.id };
}
