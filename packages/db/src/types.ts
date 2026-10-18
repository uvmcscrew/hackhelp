import { z } from 'zod';

export const WORK_ROOMS = [
	'Innovation E102',
	'Innovation E100',
	'Innovation E105',
	'Innovation E204',
	'Innovation E210 South',
	'Innovation E210 North'
] as const;

export type WorkRooms = (typeof WORK_ROOMS)[number];

export const personProfileRole = z.enum(['competitor', 'mentor', 'judge', 'admin']);
export type PersonProfileRole = z.infer<typeof personProfileRole>;
