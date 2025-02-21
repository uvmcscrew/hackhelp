<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import queries from '$lib/trpc/client/queries.svelte';
	import posthog from 'posthog-js';

	let { data }: PageProps = $props();

	const form = superForm(data.createTeamForm);
	const { form: formData, enhance, submitting } = form;

	let account = queries.queryWhoami(data);

	posthog.identify($account.data.user.username, {
		id: $account.data.user.id,
		username: $account.data.user.username,
		isOrgAdmin: $account.data.user.isOrgAdmin,
		isOrgMember: $account.data.user.isOrgMember
	});
</script>

<svelte:head>
	<title>Join or Create a Team</title>
</svelte:head>

<Card.Root class="h-full w-full">
	<Card.Header>
		<Card.Title>Create a team</Card.Title>
	</Card.Header>
	<Card.Content>
		<form method="POST" use:enhance action="/join-team?/create">
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Team Name</Form.Label>
						<Input {...props} bind:value={$formData.name} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="description">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Team Description</Form.Label>
						<Textarea {...props} bind:value={$formData.description} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Button disabled={$submitting}>Create Team</Form.Button>
		</form>
	</Card.Content>
</Card.Root>
