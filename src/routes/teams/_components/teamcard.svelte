<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { RouterOutputs } from '$lib/orpc/server';

	type Props = {
		team: RouterOutputs['teams']['listAll'][number];
	};

	const { team }: Props = $props();
</script>

<Card.Root>
	<Card.Header><Card.Title>{team.name}</Card.Title></Card.Header>
</Card.Root>
