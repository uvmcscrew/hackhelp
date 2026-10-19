import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ params }) => {
	return {
		teamId: params.id
	};
};
