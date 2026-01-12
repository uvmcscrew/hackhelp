<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import { createTicketSchema } from '$lib/schemas';
	import { posthogHandler, WORK_ROOMS } from '$lib/utils';
	import SuperDebug, { defaults, superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/components/ui/form';

	import * as Select from '$lib/components/ui/select';

	import { Input } from '$lib/components/ui/input';
	import type { IssueReturn } from '$lib/orpc/server/router/competitor';
	import { watch } from 'runed';
	import { Textarea } from '$lib/components/ui/textarea';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';

	let { ticketCreateSheetOpen = $bindable(), issueId = $bindable() } = $props();

	let issuesQuery = createQuery(orpc.competitor.tickets.getAllTeamIssues.queryOptions);

	let selectedIssue = $state<IssueReturn | null>(null);

	let createIssueMutation = createMutation(orpc.competitor.tickets.create.mutationOptions);

	let form = superForm(defaults({ ...selectedIssue }, zod4(createTicketSchema)), {
		SPA: true,
		validators: zod4(createTicketSchema),
		onUpdate: async ({ form }) => {
			if (form.valid) {
				posthogHandler((posthog) => posthog.capture('Create Ticket'));
				createIssueMutation.mutate(form.data);
				ticketCreateSheetOpen = false;
			}
		}
	});

	let { form: formData, enhance, submitting, submit } = form;

	watch(
		() => issueId,
		(curr, prev) => {
			if (curr !== prev) {
				selectedIssue = issuesQuery.data?.issues.find((iss) => iss.id.toString() === curr) || null;

				if (selectedIssue !== null) {
					formData.set({
						title: selectedIssue.title,
						issueNumber: selectedIssue.issueNumber,
						repository: selectedIssue.repoName,
						location: $formData.location,
						locationDescription: $formData.locationDescription
					});
				}
			}
		}
	);
</script>

<form use:enhance>
	<Form.Field {form} name="title" aria-disabled={!selectedIssue}>
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Title</Form.Label>
				<Input
					{...props}
					bind:value={$formData.title}
					disabled={!selectedIssue}
					placeholder={(!selectedIssue && 'Please select an issue first') || ''}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="location" aria-disabled={!selectedIssue}>
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Room</Form.Label>
				<Select.Root
					type="single"
					bind:value={$formData.location}
					name={props.name}
					disabled={!selectedIssue}
				>
					<Select.Trigger {...props}>
						{selectedIssue
							? $formData.location
								? $formData.location
								: 'Select your room'
							: 'Please select an issue first'}
					</Select.Trigger>
					<Select.Content>
						{#each WORK_ROOMS as location}
							<Select.Item value={location} label={location} />
						{/each}
					</Select.Content>
				</Select.Root>
			{/snippet}
		</Form.Control>
		<Form.Description>
			Note that Kalkin and Ifshin are one building when it comes to room numbers. If you would like
			to meet your mentor in the mentor room {'Ifshin 240'}, please select that location when
			creating your ticket.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="locationDescription" aria-disabled={!selectedIssue}>
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Location Description</Form.Label>
				<Textarea
					{...props}
					bind:value={$formData.locationDescription}
					disabled={!selectedIssue}
					class=" h-44 resize-none"
					placeholder={selectedIssue
						? "If you're in a larger room where there are multiple groups, please provide a description of where you are in the room."
						: 'Please select an issue first'}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field> -->
</form>

<Sheet.Footer class="mt-2 font-mono sm:justify-start">
	<Button
		onclick={() => {
			submit();
		}}
		disabled={!selectedIssue || $submitting}
	>
		{#if $submitting}
			Creating <LoaderCircle class="ml-2 size-4 animate-spin" />
		{:else if !selectedIssue}
			Please select an issue
		{:else}
			Create Ticket
		{/if}
	</Button>
	<Sheet.Close class={buttonVariants({ variant: 'outline' })}>Close</Sheet.Close>
</Sheet.Footer>
