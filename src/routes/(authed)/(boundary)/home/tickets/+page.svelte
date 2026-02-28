<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { clientEnv } from '$lib/env/client';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import TicketStatusBadge from '$lib/components/ticket-status-badge.svelte';
	import { MarkGithub24 as GithubIcon } from 'svelte-octicons';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { cn } from '$lib/utils';
	import { tick } from 'svelte';

	const queryClient = useQueryClient();

	// ─── Queries ──────────────────────────────────────────────────────────
	const myTeamQuery = createQuery(() => orpc.teams.myTeam.queryOptions());

	const ticketsQuery = createQuery(() =>
		orpc.tickets.myTeamTickets.queryOptions({
			enabled: !!myTeamQuery.data
		})
	);

	const issuesQuery = createQuery(() =>
		orpc.tickets.teamIssues.queryOptions({
			enabled: !!myTeamQuery.data?.githubSlug
		})
	);

	// ─── Create Ticket Sheet State ───────────────────────────────────────
	let ticketSheetOpen = $state(false);
	let issueComboboxOpen = $state(false);
	let selectedIssueId = $state<string | null>(null);
	let ticketTitle = $state('');
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, svelte/no-top-level-browser-globals
	let triggerRef = $state<HTMLButtonElement>(null!);

	const selectedIssue = $derived(
		issuesQuery.data?.issues.find((iss) => iss.id.toString() === selectedIssueId)
	);

	$effect(() => {
		if (selectedIssue) {
			ticketTitle = selectedIssue.title;
		}
	});

	$effect(() => {
		if (!ticketSheetOpen) {
			selectedIssueId = null;
			ticketTitle = '';
		}
	});

	function closeComboboxAndFocus() {
		issueComboboxOpen = false;
		void tick().then(() => triggerRef?.focus());
	}

	const createTicketMutation = createMutation(() =>
		orpc.tickets.create.mutationOptions({
			onSuccess: async () => {
				ticketSheetOpen = false;
				await queryClient.invalidateQueries({ queryKey: ['tickets'] });
			}
		})
	);

	function handleCreateTicket() {
		if (!selectedIssue) return;
		createTicketMutation.mutate({
			title: ticketTitle || selectedIssue.title,
			repository: selectedIssue.repoName,
			issueNumber: selectedIssue.issueNumber
		});
	}
</script>

<svelte:head>
	<title>Tickets</title>
</svelte:head>

<div class="container mx-auto flex max-w-4xl flex-col gap-6 py-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Tickets</h1>
	</div>

	{#if myTeamQuery.isLoading}
		<p class="text-muted-foreground">Loading...</p>
	{:else if !myTeamQuery.data}
		<Card.Root>
			<Card.Header>
				<Card.Title>No Team</Card.Title>
				<Card.Description>You need to be on a team to manage tickets.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Button href="/home/create-team">Create a Team</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		{@const team = myTeamQuery.data}

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between">
				<div>
					<Card.Title>Tickets</Card.Title>
					<Card.Description>Help requests from your team</Card.Description>
				</div>
				<!-- Create Ticket Sheet -->
				<Sheet.Root bind:open={ticketSheetOpen}>
					<Sheet.Trigger disabled={!team.githubSlug} class={buttonVariants({ variant: 'default' })}>
						Create Ticket
					</Sheet.Trigger>
					<Sheet.Content side="right" class="font-mono">
						<Sheet.Header>
							<Sheet.Title>Create Ticket</Sheet.Title>
							<Sheet.Description>Create a ticket from a GitHub Issue</Sheet.Description>
						</Sheet.Header>

						<!-- Issue Combobox -->
						<div class="my-4 flex flex-col gap-y-2">
							<Label>GitHub Issue</Label>
							<Popover.Root bind:open={issueComboboxOpen}>
								<Popover.Trigger bind:ref={triggerRef}>
									{#snippet child({ props })}
										<Button
											variant="outline"
											class="w-full justify-between"
											{...props}
											role="combobox"
											aria-expanded={issueComboboxOpen}
										>
											{selectedIssue ? selectedIssue.title : 'Select an issue...'}
											<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
										</Button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content class="w-full p-0">
									<Command.Root>
										<Command.Input placeholder="Search issues..." />
										<Command.List>
											<Command.Empty>No matching issues</Command.Empty>
											<Command.Group>
												{#if issuesQuery.data}
													{#each issuesQuery.data.issues as issue (issue.id)}
														<Command.Item
															value={issue.id.toString()}
															onSelect={() => {
																selectedIssueId = issue.id.toString();
																closeComboboxAndFocus();
															}}
														>
															<Check
																class={cn(
																	'mr-2 size-4',
																	selectedIssueId !== issue.id.toString() && 'text-transparent'
																)}
															/>
															{issue.title}
															<span class="text-muted-foreground ml-auto text-xs">
																{issue.repoName}#{issue.issueNumber}
															</span>
														</Command.Item>
													{/each}
												{/if}
											</Command.Group>
										</Command.List>
									</Command.Root>
								</Popover.Content>
							</Popover.Root>
						</div>

						<!-- Title -->
						<div class="flex flex-col gap-y-2">
							<Label for="ticket-title">Title</Label>
							<Input
								id="ticket-title"
								bind:value={ticketTitle}
								disabled={!selectedIssue}
								placeholder={selectedIssue ? '' : 'Select an issue first'}
							/>
						</div>

						<Sheet.Footer class="mt-6 sm:justify-start">
							<Button
								onclick={handleCreateTicket}
								disabled={!selectedIssue || createTicketMutation.isPending}
							>
								{#if createTicketMutation.isPending}
									Creating <LoaderCircle class="ml-2 size-4 animate-spin" />
								{:else if !selectedIssue}
									Select an issue
								{:else}
									Create Ticket
								{/if}
							</Button>
							<Sheet.Close class={buttonVariants({ variant: 'outline' })}>Close</Sheet.Close>
						</Sheet.Footer>
					</Sheet.Content>
				</Sheet.Root>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Title</Table.Head>
							<Table.Head>Issue</Table.Head>
							<Table.Head class="w-min">Status</Table.Head>
							<Table.Head>Mentor</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if ticketsQuery.isLoading}
							<Table.Row>
								<Table.Cell colspan={4} class="text-muted-foreground text-center italic">
									Loading tickets...
								</Table.Cell>
							</Table.Row>
						{:else if ticketsQuery.data && ticketsQuery.data.tickets.length > 0}
							{#each ticketsQuery.data.tickets as ticket (ticket.id)}
								<Table.Row>
									<Table.Cell class="font-medium">{ticket.title}</Table.Cell>
									<Table.Cell>
										<a
											href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${ticket.repository}/issues/${ticket.issueNumber}`}
											target="_blank"
											class={buttonVariants({
												variant: 'link',
												class: 'inline-flex items-center gap-1 px-0'
											})}
										>
											<GithubIcon class="fill-primary size-4!" />
											{ticket.repository}#{ticket.issueNumber}
										</a>
									</Table.Cell>
									<Table.Cell>
										<TicketStatusBadge status={ticket.resolutionStatus} />
									</Table.Cell>
									<Table.Cell>
										{ticket.assignedMentorName ?? 'Not Assigned'}
									</Table.Cell>
								</Table.Row>
							{/each}
						{:else}
							<Table.Row>
								<Table.Cell colspan={4} class="text-muted-foreground text-center italic">
									No tickets yet.
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
