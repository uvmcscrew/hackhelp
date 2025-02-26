<svelte:options runes={true} />

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import queries from '$lib/trpc/client/queries.svelte';
	import type { RouterOutputs } from '$lib/trpc/server';
	import * as Tabs from '$lib/components/ui/tabs';
	import RepoCreatorSheet from './repo-creator-sheet.svelte';
	import SquareArrowOutUpRight from 'lucide-svelte/icons/square-arrow-out-up-right';
	import GithubIcon from 'lucide-svelte/icons/github';
	import { Badge } from '$lib/components/ui/badge';
	import { watch } from 'runed';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { useQueryClient } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';

	let repos = queries.competitorGetTeamRepos();

	let repoCountString = $derived(`${$repos.data?.repos.length ?? '?'}/3`);

	const queryClient = useQueryClient();

	let manualRefreshing = $state(false);
</script>

<Tabs.Root class="col-span-1 col-start-1 row-span-1 row-start-2 flex flex-col">
	<Tabs.List class="w-fit">
		<Tabs.Trigger value="challenge">Challenge</Tabs.Trigger>
		<Tabs.Trigger value="repos">Repositories</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="empty" class="h-auto shrink-0 grow">
		<Card.Root class="col-span-1 col-start-1 row-span-1 row-start-2 h-full"></Card.Root>
	</Tabs.Content>
	<Tabs.Content value="challenge" class="h-auto shrink-0 grow">
		<Card.Root class="col-span-1 col-start-1 row-span-1 row-start-2 h-full">
			<Card.Header class="flex h-14 flex-row items-center justify-between">
				<Card.Title>Your Challenge</Card.Title>
			</Card.Header>
			<Card.Content>No challenge selected?</Card.Content>
			<Card.Footer class="grid w-fit grid-cols-2 grid-rows-3"></Card.Footer>
		</Card.Root>
	</Tabs.Content>
	<Tabs.Content value="repos" class="h-auto shrink-0 grow">
		<Card.Root class="col-span-1 col-start-1 row-span-1 row-start-2 h-full">
			<Card.Header class="flex h-14 flex-row items-center justify-between">
				<Card.Title class="inline-flex items-center gap-x-2">
					Repositories <span class="text-muted-foreground">{repoCountString}</span>
					{#if manualRefreshing}
						<LoaderCircle class="h-4 w-4 animate-spin" />
					{/if}
				</Card.Title>
				<RepoCreatorSheet />
			</Card.Header>
			<Card.Content>
				{#if $repos.data}
					{#if $repos.data.repos.length > 0}
						<ul>
							{#each $repos.data.repos as repo}
								<li>
									<a
										href={repo.htmlUrl}
										target="_blank"
										class="hover:bg-muted/50 data-[state=selected]:bg-muted inline-flex w-full border-b p-2 transition-colors"
									>
										<GithubIcon class="mr-2 h-6 w-6" /> <span>{repo.name}</span>

										<SquareArrowOutUpRight class="ml-auto h-5 w-5" />
										<Badge hoverEffects={false} variant="outline" class="ml-2"
											>{repo.private ? 'Private' : 'Public'}</Badge
										>
										{#if repo.language}
											<Badge hoverEffects={false} variant="outline" class="ml-2"
												>{repo.language}</Badge
											>
										{/if}
									</a>
								</li>
							{/each}
							{#if $repos.data.repos.length >= 3}
								<li class="text-muted-foreground mt-2 w-full text-center text-sm italic">
									Repository limit reached. <br /> Delete a repo in GitHub to add more. <br />
									<Button
										variant="link"
										size="sm"
										disabled={manualRefreshing}
										onclick={async () => {
											manualRefreshing = true;
											await queryClient.invalidateQueries({ queryKey: ['repositories'] });
											manualRefreshing = false;
										}}>Refresh</Button
									>
								</li>
							{/if}
						</ul>
					{:else}
						<p>No repositories found</p>
					{/if}
				{:else}
					<span class="text-muted-foreground italic">Loading...</span>
				{/if}
			</Card.Content>
		</Card.Root>
	</Tabs.Content>
</Tabs.Root>
