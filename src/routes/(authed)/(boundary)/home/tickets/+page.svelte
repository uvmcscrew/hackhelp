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
	import { Badge } from '$lib/components/ui/badge';
	import TicketStatusBadge from '$lib/components/ticket-status-badge.svelte';
	import { MarkGithub24 as GithubIcon } from 'svelte-octicons';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import XIcon from 'lucide-svelte/icons/x';
	import CheckIcon from 'lucide-svelte/icons/check';
	import { cn } from '$lib/utils';
	import { tick } from 'svelte';
	import { Debounced } from 'runed';

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

	const reposQuery = createQuery(() =>
		orpc.teams.repos.list.queryOptions({
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

	// When an issue is selected, pre-fill the title
	$effect(() => {
		if (selectedIssue) {
			ticketTitle = selectedIssue.title;
		}
	});

	// Reset state when sheet closes
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
				await queryClient.invalidateQueries({ queryKey: ['tickets', 'teamIssues'] });
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

	// ─── Create Repo Sheet State ─────────────────────────────────────────
	let repoSheetOpen = $state(false);
	let repoSlug = $state('');
	let repoSlugDebounced = new Debounced(() => repoSlug, 500);

	let repoCheckQuery = createQuery(() =>
		orpc.teams.repos.checkName.queryOptions({
			input: { repoName: repoSlugDebounced.current },
			enabled: repoSheetOpen && repoSlugDebounced.current.length > 1
		})
	);

	const repoNameValid = $derived(
		repoCheckQuery.data?.repoExists === false && repoSlugDebounced.current.length > 1
	);

	// Reset repo state when sheet closes
	$effect(() => {
		if (!repoSheetOpen) {
			repoSlug = '';
		}
	});

	const createRepoMutation = createMutation(() =>
		orpc.teams.repos.create.mutationOptions({
			onSuccess: async () => {
				repoSheetOpen = false;
				await queryClient.invalidateQueries({ queryKey: ['teams', 'repos'] });
			}
		})
	);

	async function handleCreateRepo() {
		await createRepoMutation.mutateAsync({
			repoName: repoSlugDebounced.current
		});
	}

	const repoLimitReached = $derived(reposQuery.data ? reposQuery.data.repos.length >= 3 : false);
</script>

<svelte:head>
	<title>Tickets & Repos</title>
</svelte:head>

<div class="container mx-auto flex max-w-4xl flex-col gap-6 py-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Tickets & Repositories</h1>
	</div>

	{#if myTeamQuery.isLoading}
		<p class="text-muted-foreground">Loading...</p>
	{:else if !myTeamQuery.data}
		<Card.Root>
			<Card.Header>
				<Card.Title>No Team</Card.Title>
				<Card.Description>You need to be on a team to manage tickets and repos.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Button href="/home/create-team">Create a Team</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		{@const team = myTeamQuery.data}

		<!-- ─── Repositories Section ────────────────────────────────────── -->
		{#if team.githubSlug}
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<Card.Title>Repositories</Card.Title>
						<Badge variant="secondary" hoverEffects={false}>
							{reposQuery.data?.repos.length ?? 0}/3
						</Badge>
					</div>
					<Card.Description>Your team's GitHub repositories</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-2">
					{#if reposQuery.isLoading}
						<p class="text-muted-foreground text-sm">Loading repos...</p>
					{:else if reposQuery.data && reposQuery.data.repos.length > 0}
						{#each reposQuery.data.repos as repo (repo.id)}
							<div class="flex items-center justify-between rounded border px-3 py-2">
								<div class="flex flex-col">
									<span class="text-sm font-medium">{repo.name}</span>
									{#if repo.description}
										<span class="text-muted-foreground text-xs">{repo.description}</span>
									{/if}
								</div>
								<Button variant="outline" size="sm" href={repo.htmlUrl} target="_blank">
									View
								</Button>
							</div>
						{/each}
					{:else}
						<p class="text-muted-foreground text-sm italic">No repositories yet.</p>
					{/if}
				</Card.Content>
				<Card.Footer>
					<!-- Create Repo Sheet -->
					<Sheet.Root bind:open={repoSheetOpen}>
						<Sheet.Trigger
							disabled={repoLimitReached}
							class={buttonVariants({ variant: 'default', size: 'sm' })}
						>
							Create Repository
						</Sheet.Trigger>
						<Sheet.Content side="right">
							<Sheet.Header>
								<Sheet.Title>Create Repository</Sheet.Title>
								<Sheet.Description>Create a new private repository for your team</Sheet.Description>
							</Sheet.Header>
							<div class="grid gap-4 py-4">
								<div class="grid grid-cols-4 grid-rows-2 items-center gap-4">
									<Label for="repo-name" class="row-start-1 text-right">Repo Slug</Label>
									<Input
										disabled={createRepoMutation.isPending}
										autocomplete="off"
										id="repo-name"
										bind:value={repoSlug}
										class="col-span-3 row-start-2"
									/>
									<span class="col-start-4 row-start-2">
										{#if repoCheckQuery.isFetching}
											<LoaderCircle class="h-6 w-6 animate-spin" />
										{:else if repoCheckQuery.data}
											{#if repoCheckQuery.data.repoExists}
												<XIcon class="h-6 w-6 stroke-red-500" />
											{:else}
												<CheckIcon class="h-6 w-6 stroke-green-500" />
											{/if}
										{:else if repoSlugDebounced.current.length > 1}
											<XIcon class="h-6 w-6 stroke-red-500" />
										{/if}
									</span>
								</div>
							</div>
							<Sheet.Footer class="sm:justify-start">
								<Button
									disabled={!repoNameValid || createRepoMutation.isPending}
									onclick={handleCreateRepo}
								>
									{#if createRepoMutation.isPending}
										Creating <LoaderCircle class="ml-2 h-6 w-6 animate-spin" />
									{:else}
										Create Repository
									{/if}
								</Button>
								<Sheet.Close class={buttonVariants({ variant: 'outline' })}>Close</Sheet.Close>
							</Sheet.Footer>
						</Sheet.Content>
					</Sheet.Root>
				</Card.Footer>
			</Card.Root>
		{/if}

		<!-- ─── Tickets Section ─────────────────────────────────────────── -->
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
