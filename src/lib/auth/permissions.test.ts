import { expect, test } from 'bun:test';
import { ac, checkRolePermission } from './permissions';

test('admin permissions', () => {
	expect(
		checkRolePermission({
			role: 'admin',
			// @ts-expect-error Technically the types are not correct but this helps make sure stuff stays in sync
			permissions: ac.statements
		})
	).toBe(true);

	expect(
		checkRolePermission({
			roles: 'verifiedUser,admin',
			permissions: {
				configuration: ['view']
			}
		})
	).toBe(true);
});

test('verifiedUser permissions', () => {
	expect(
		checkRolePermission({
			roles: 'verifiedUser',
			permissions: {
				configuration: ['view']
			}
		})
	).toBe(false);

	expect(
		checkRolePermission({
			roles: 'verifiedUser',
			permissions: {
				profile: ['create', 'update']
			}
		})
	).toBe(true);
});
