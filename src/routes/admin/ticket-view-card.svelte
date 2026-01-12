<svelte:options runes />

<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { clientEnv } from '$lib/env/client';
	import { MarkGithub24 as GithubIcon } from 'svelte-octicons';
	import TicketAssigneeCombobox from './ticket-assignee-combobox.svelte';
	import TicketStateChanger from './ticket-state-changer.svelte';
	import { Label } from '$lib/components/ui/label';
	import TicketStatusBadge from '$lib/components/ticket-status-badge.svelte';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';

	let ticketId = $derived.by(() => {
		return page.url.searchParams.get('ticketId');
	});

	let ticketQuery = createQuery(() =>
		orpc.admin.tickets.getTicketById.queryOptions({ input: { ticketId } })
	);

	let queryClient = useQueryClient();
</script>

{#if ticketId && ticketQuery.data}
	<div class="col-span-1 col-start-4 row-span-3 row-start-1 pt-11">
		<Card.Card class="h-full w-full overflow-y-scroll">
			<Card.Header class="flex flex-row items-center justify-between">
				<Card.Title class="h-full">Ticket Viewer</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col justify-start gap-y-4">
				<div class="my-4 flex flex-col gap-y-2">
					<Button
						size="sm"
						variant="outline"
						onclick={async () =>
							await queryClient.invalidateQueries({
								queryKey: ['admin', 'ticket', ticketQuery.data.ticket.ticket.id]
							})}>Refresh</Button
					>
				</div>

				{#key ticketId}
					{#key ticketQuery.data.ticket.user?.id}
						<TicketAssigneeCombobox {ticketId} initialMentorId={ticketQuery.data.ticket.user?.id} />
					{/key}
				{/key}

				<div class="flex flex-col gap-y-1">
					<h2 class="font-semibold">Location</h2>
					<p>{ticketQuery.data.ticket.ticket.location}</p>
					<h2 class="font-semibold">Location Description</h2>
					<p>{ticketQuery.data.ticket.ticket.locationDescription}</p>
				</div>

				<!-- Repo information card -->
				<Card.Card class="h-full w-full">
					<Card.Header class="flex flex-row items-center justify-between">
						<Card.Title class="h-full">{ticketQuery.data.ticket.ticket.title}</Card.Title>
					</Card.Header>
					<Card.Content class="flex flex-col justify-start gap-y-4"></Card.Content>
					<Card.Footer
						><Button
							href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${ticketQuery.data.ticket.ticket.repository}/issues/${ticketQuery.data.ticket.ticket.issueNumber}`}
							variant="link"
							target="_blank"
							class="px-0"
							><GithubIcon class=" fill-primary !size-5" />{ticketQuery.data.ticket.ticket
								.repository}#{ticketQuery.data.ticket.ticket.issueNumber}</Button
						></Card.Footer
					>
				</Card.Card>
				<!-- yeet -->
				<div class="my-4 mb-2 flex flex-col gap-y-2">
					<Label>Current Status</Label>
					<TicketStatusBadge status={ticketQuery.data.ticket.ticket.resolutionStatus} />
				</div>
				{#key ticketId}
					<TicketStateChanger {ticketId} />
				{/key}
			</Card.Content>
			<Card.Footer><Button href="/admin" variant="outline">Close</Button></Card.Footer>
		</Card.Card>
	</div>
{:else}
	<div class="col-span-1 col-start-4 row-span-3 row-start-1 grid place-content-center">
		<p class="text-muted-foreground italic">Select a ticket to view details</p>
	</div>
{/if}
