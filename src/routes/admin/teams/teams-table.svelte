<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { MarkGithub24 as GithubIcon } from 'svelte-octicons';

	import queries from '$lib/trpc/client/queries.svelte';
	import type { RouterOutputs } from '$lib/trpc/server';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import XIcon from 'lucide-svelte/icons/x';
	import { clientEnv } from '$lib/env/client';
	import SquareChevronRight from 'lucide-svelte/icons/square-chevron-right';

	type TeamsData = RouterOutputs['admin']['teams']['all'];

	type Props = {
		teams: TeamsData;
	};

	let props: Props = $props();

	let teams = queries.adminGetAllTeams(props.teams);
</script>

<Card.Root class="col-span-3 col-start-1 row-span-3 row-start-1">
	<Card.Content>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="">Name</Table.Head>
					<Table.Head class=" w-8">Members</Table.Head>
					<Table.Head>Prompt Selected</Table.Head>
					<Table.Head>Join Code</Table.Head>
					<Table.Head class="sr-only w-min">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if $teams.data}
					{#each $teams.data.teams as team}
						<Table.Row>
							<Table.Cell class="font-medium">{team.name}</Table.Cell>
							<Table.Cell>{team.memberCount}</Table.Cell>
							<Table.Cell
								>{#if team.challengeName && team.challengeRepo}
									<Button
										href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${team.challengeRepo}`}
										variant="link"
										class="px-0"
										target="_blank"
									>
										<GithubIcon class="fill-primary !size-5" />{team.challengeRepo}
									</Button>
								{:else}
									<XIcon class="stroke-destructive fill-destructive" />
								{/if}
							</Table.Cell>
							{#if team.joinCode}
								<Table.Cell>{team.joinCode}</Table.Cell>
							{:else}
								<Table.Cell class="text-muted-foreground italic">Not Set</Table.Cell>
							{/if}

							<Table.Cell>
								<Button variant="outline" size="icon" href="/admin/teams?teamId={team.id}"
									><SquareChevronRight class="size-4" /></Button
								>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Root>
