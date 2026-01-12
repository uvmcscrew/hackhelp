<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { defaults, superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import queries from '$lib/trpc/client/queries.svelte';
	import { posthogHandler } from '$lib/utils';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { createTeamSchema } from '$lib/schemas';
	import mutations from '$lib/trpc/client/mutations.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { goto } from '$app/navigation';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';

	let { data: initialData }: PageProps = $props();

	let createTeamMutation = createMutation(orpc.competitor.team.create.mutationOptions);

	const form = superForm(defaults(zod4(createTeamSchema)), {
		SPA: true,
		validators: zod4(createTeamSchema),
		onUpdate: async ({ form }) => {
			if (form.valid) {
				const res = await createTeamMutation.mutateAsync(form.data);
				posthogHandler((posthog) => posthog.capture('Create Team'));
				await goto('/home');
			}
		}
	});
	const { form: formData, enhance, submitting } = form;

	let account = createQuery(() => orpc.account.whoami.queryOptions({ initialData }));

	posthogHandler((posthog) =>
		posthog.identify(account.data.user.username, {
			id: account.data.user.id,
			username: account.data.user.username,
			isOrgAdmin: account.data.user.isOrgAdmin,
			isOrgMember: account.data.user.isOrgMember
		})
	);
</script>

<svelte:head>
	<title>Join or Create a Team</title>
</svelte:head>

<Card.Root class="h-full w-full">
	<Card.Header>
		<Card.Title>Create a team</Card.Title>
	</Card.Header>
	<Card.Content>
		<form use:enhance>
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
			<Form.Button disabled={$submitting}>
				{#if $submitting || createTeamMutation.isPending}
					Submitting... <LoaderCircle class="h-6 w-6 animate-spin" />
				{:else}
					Create Team
				{/if}
			</Form.Button>
		</form>
	</Card.Content>
</Card.Root>
