<svelte:options runes={true} />

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Card.Root>
	<Card.Header class="flex flex-row"
		><Card.Title></Card.Title>
		<Button href={`/teams/${data.team.id}/join`}>Join</Button></Card.Header
	>
	<Card.Content>
		<ul>
			{#each data.team.members as member (member.user?.id)}
				<li>{member.user?.name}</li>
			{/each}
		</ul>
	</Card.Content>
</Card.Root>
