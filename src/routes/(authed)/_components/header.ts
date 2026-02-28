type Links = { href: string; text: string }[];

type HeaderNavConfig = Record<string, Links>;

export const headerNavLinks: HeaderNavConfig = {
	'/home': [
		{ text: 'Dashboard', href: '/home' },
		{ text: 'Team', href: '/home/team' },
		{ text: 'Challenges', href: '/home/challenges' },
		{ text: 'Tickets', href: '/home/tickets' }
	],
	'/admin': [
		{ text: 'Dashboard', href: '/admin' },
		{ text: 'Users', href: '/admin/users' },
		{ text: 'Teams', href: '/admin/teams' },
		{ text: 'Challenges', href: '/admin/challenges' },
		{ text: 'Config', href: '/admin/config' },
		{ text: 'Tickets', href: '/mentor/tickets' }
	],
	'/mentor': [
		{ text: 'Dashboard', href: '/mentor' },
		{ text: 'Teams', href: '/admin/teams' },
		{ text: 'Tickets', href: '/mentor/tickets' }
	],
	'/judging': [
		{ text: 'Dashboard', href: '/judging' },
		{ text: 'Teams', href: '/admin/teams' }
	]
} as const;
