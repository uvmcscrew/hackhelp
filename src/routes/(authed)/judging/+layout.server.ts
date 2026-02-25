import { checkRolePermission } from '$lib/auth/permissions';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = ((event) => {
	const roleString = event.locals.auth.user?.role || '';

	const permsCheck = checkRolePermission({
		roles: roleString,
		permissions: { judging: ['view'] }
	});

	if (!permsCheck) {
		error(400, { message: 'You are not allowed to view this page' });
	}

	return {};
}) satisfies LayoutServerLoad;
