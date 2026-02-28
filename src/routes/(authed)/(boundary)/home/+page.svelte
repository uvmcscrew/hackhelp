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
	import { TEAM_MAX_SIZE } from '$lib/config/team-rules';
	import { cn } from '$lib/utils';
	import { tick } from 'svelte';
	import { Debounced } from 'runed';
	import { MarkGithub24 as GithubIcon } from 'svelte-octicons';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import XIcon from 'lucide-svelte/icons/x';
	import CheckIcon from 'lucide-svelte/icons/check';

	const queryClient = useQueryClient();

	// ─── Queries ──────────────────────────────────────────────────────────
	const myTeamQuery = createQuery(() => orpc.teams.myTeam.queryOptions());

	const reposQuery = createQuery(() =>
		orpc.teams.repos.list.queryOptions({
			enabled: !!myTeamQuery.data?.githubSlug
		})
	);

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

	$effect(() => {
		if (ticketSheetOpen) {
			queryClient.invalidateQueries({ queryKey: orpc.tickets.teamIssues.queryKey() });
		}
	});

	const createTicketMutation = createMutation(() =>
		orpc.tickets.create.mutationOptions({
			onSuccess: async () => {
				ticketSheetOpen = false;
				await Promise.all([
					queryClient.invalidateQueries({ queryKey: orpc.tickets.myTeamTickets.queryKey() }),
					queryClient.invalidateQueries({ queryKey: orpc.tickets.teamIssues.queryKey() })
				]);
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

	$effect(() => {
		if (!repoSheetOpen) {
			repoSlug = '';
		}
	});

	const createRepoMutation = createMutation(() =>
		orpc.teams.repos.create.mutationOptions({
			onSuccess: async () => {
				repoSheetOpen = false;
				await Promise.all([
					queryClient.invalidateQueries({ queryKey: orpc.teams.repos.list.queryKey() }),
					queryClient.invalidateQueries({ queryKey: orpc.tickets.teamIssues.queryKey() })
				]);
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
	<title>Home</title>
</svelte:head>

{#if myTeamQuery.isLoading}
	<div class="flex items-center justify-center p-12">
		<p class="text-muted-foreground">Loading...</p>
	</div>
{:else if myTeamQuery.data}
	{@const team = myTeamQuery.data}
	<div class="grid h-[calc(100vh-4rem-2rem)] grid-cols-4 gap-4 p-4">
		<!-- ─── Left Column: Team + Repos ──────────────────────────────── -->
		<div class="col-span-1 flex flex-col gap-4 overflow-y-auto">
			<!-- Team Card -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<Card.Title class="text-lg">{team.name}</Card.Title>
						{#if team.myMembership.isCaptain}
							<Badge variant="default">Captain</Badge>
						{/if}
					</div>
					<Card.Description>
						<Badge variant="secondary" hoverEffects={false}>{team.myMembership.role}</Badge>
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
					<!-- Join Code -->
					<div class="flex flex-col gap-1">
						<span class="text-muted-foreground text-xs font-medium">Join Code</span>
						<code class="bg-muted w-fit rounded px-2 py-1 font-mono text-sm tracking-widest">
							{team.joinCode}
						</code>
					</div>

					<!-- Members -->
					<div class="flex flex-col gap-1">
						<span class="text-muted-foreground text-xs font-medium">
							Members ({team.members.length}/{TEAM_MAX_SIZE})
						</span>
						<ul class="divide-y">
							{#each team.members as member (member.membership.userId)}
								<li class="flex items-center justify-between py-1.5">
									<div class="flex items-center gap-1.5">
										{#if member.user?.image}
											<img
												src={member.user.image}
												alt={member.user.name}
												class="h-5 w-5 rounded-full"
											/>
										{/if}
										<span class="text-xs font-medium">{member.user?.name ?? 'Unknown'}</span>
										{#if member.membership.isCaptain}
											<Badge variant="default" hoverEffects={false} class="px-1 py-0 text-[10px]"
												>C</Badge
											>
										{/if}
									</div>
									<Badge variant="secondary" hoverEffects={false} class="text-[10px]">
										{member.membership.role}
									</Badge>
								</li>
							{/each}
						</ul>
					</div>

					<!-- Status Badges -->
					<div class="flex flex-wrap gap-1.5">
						{#if team.canJoin}
							<Badge variant="green" hoverEffects={false} class="text-xs">Open</Badge>
						{:else}
							<Badge variant="secondary" hoverEffects={false} class="text-xs">Closed</Badge>
						{/if}
						{#if team.isPublic}
							<Badge variant="green" hoverEffects={false} class="text-xs">Public</Badge>
						{:else}
							<Badge variant="secondary" hoverEffects={false} class="text-xs">Private</Badge>
						{/if}
					</div>
				</Card.Content>
				<Card.Footer>
					<Button size="sm" href="/home/team">
						{team.myMembership.isCaptain ? 'Manage Team' : 'View Team'}
					</Button>
				</Card.Footer>
			</Card.Root>

			<!-- Repos Card -->
			{#if team.githubSlug}
				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<Card.Title class="text-lg">Repositories</Card.Title>
							<Badge variant="secondary" hoverEffects={false}>
								{reposQuery.data?.repos.length ?? 0}/3
							</Badge>
						</div>
					</Card.Header>
					<Card.Content class="flex flex-col gap-2">
						{#if reposQuery.isLoading}
							<p class="text-muted-foreground text-xs">Loading repos...</p>
						{:else if reposQuery.data && reposQuery.data.repos.length > 0}
							{#each reposQuery.data.repos as repo (repo.id)}
								<div class="flex items-center justify-between rounded border px-2 py-1.5">
									<span class="truncate text-xs font-medium">{repo.name}</span>
									<Button
										variant="outline"
										size="sm"
										href={repo.htmlUrl}
										target="_blank"
										class="ml-2 h-6 px-2 text-xs"
									>
										View
									</Button>
								</div>
							{/each}
						{:else}
							<p class="text-muted-foreground text-xs italic">No repositories yet.</p>
						{/if}
					</Card.Content>
					<Card.Footer>
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
									<Sheet.Description>
										Create a new private repository for your team
									</Sheet.Description>
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
		</div>

		<!-- ─── Right Column: Tickets ──────────────────────────────────── -->
		<div class="col-span-3 flex flex-col overflow-hidden">
			<Card.Root class="flex flex-1 flex-col overflow-hidden">
				<Card.Header class="flex flex-row items-center justify-between">
					<div>
						<Card.Title>Tickets</Card.Title>
						<Card.Description>
							{ticketsQuery.data?.tickets.length ?? 0} help requests
						</Card.Description>
					</div>
					<div class="flex items-center gap-2">
						<!-- Create Ticket Sheet -->
						<Sheet.Root bind:open={ticketSheetOpen}>
							<Sheet.Trigger
								disabled={!team.githubSlug}
								class={buttonVariants({ variant: 'default', size: 'sm' })}
							>
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
					</div>
				</Card.Header>
				<Card.Content class="flex-1 overflow-y-auto">
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
										No tickets yet. Create one to get help from a mentor.
									</Table.Cell>
								</Table.Row>
							{/if}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
{:else}
	<!-- No team -->
	<div class="container mx-auto flex max-w-2xl flex-col gap-6 py-8">
		<Card.Root>
			<Card.Header>
				<Card.Title>No Team Yet</Card.Title>
				<Card.Description>Create a team or join one using a join code.</Card.Description>
			</Card.Header>
			<Card.Content class="flex gap-3">
				<Button href="/home/create-team">Create a Team</Button>
				<Button variant="outline" href="/teams">Browse Teams</Button>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
