import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoadEvent } from './$types';
import { error } from '@sveltejs/kit';

export const load = async (event: LayoutServerLoadEvent) => {
	if (!event.locals.auth.user) {
		return redirect(302, '/login');
	}

	if (!(await event.parent()).team.canJoin) {
		error(400, 'Team is not joinable');
	}
};
