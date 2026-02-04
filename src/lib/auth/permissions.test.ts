import { expect, test } from 'bun:test';
import { ac, addRole, checkRolePermission, removeRole } from './permissions';

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

const addRoleCases = [
	['judge,verifiedUser', 'admin', 'judge,verifiedUser,admin'],
	['mentor,judge', 'judge', 'mentor,judge'],
	['', 'admin', 'admin']
];

const removeRoleCases = [
	['admin,judge,verifiedUser', 'admin', 'judge,verifiedUser'],
	['mentor,judge', 'admin', 'mentor,judge'],
	['', 'admin', '']
];

test.each(addRoleCases)('Add role %p + %p == %p', (oldRoles, toAdd, newRoles) => {
	// @ts-expect-error Cannot narrow properly
	const r = addRole(oldRoles, toAdd).join(',');
	expect(r).toBe(newRoles);
	expect(r).toContain(toAdd);
});

test.each(removeRoleCases)('Add role %p + %p == %p', (oldRoles, toRm, newRoles) => {
	// @ts-expect-error Cannot narrow properly
	const r = removeRole(oldRoles, toRm).join(',');
	expect(r).toBe(newRoles);
	expect(r).not.toContain(toRm);
});
