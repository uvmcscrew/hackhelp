<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { FormButton } from '$lib/components/ui/form';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Join or Create a Team</title>
</svelte:head>

<Card.Root class="h-full w-full">
	<Card.Header>
		<Card.Title>Create a team</Card.Title>
	</Card.Header>
	<Card.Content>
		<form></form>
	</Card.Content>
</Card.Root>
