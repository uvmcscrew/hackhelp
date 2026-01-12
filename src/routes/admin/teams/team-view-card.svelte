<svelte:options runes />

<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createQuery } from '@tanstack/svelte-query';

	let teamId = $derived.by(() => {
		return page.url.searchParams.get('teamId');
	});

	// @ts-expect-error unique symbol on orpc input
	let teamQuery = createQuery(() => orpc.admin.teams.getById.queryOptions({ input: { teamId } }));
</script>

{#if teamId && teamQuery.data}
	<div class="col-span-1 col-start-4 row-span-3 row-start-1">
		<Card.Card class="h-full w-full">
			<Card.Header class="flex flex-row items-center justify-between">
				<Card.Title class="h-full">Team Viewer</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col justify-start gap-y-4">
				<!-- Team information card -->
				<Card.Card class="border-primary h-full w-full">
					<Card.Header class="flex flex-row items-center justify-between">
						<Card.Title class="h-full">{teamQuery.data.team.team.name}</Card.Title>
					</Card.Header>
					<Card.Content class="flex flex-col justify-start gap-y-4">
						<h2 class="text-lg">Members</h2>
						<ul class="text-sm">
							{#each teamQuery.data.members as member (member.id)}
								<li class="">
									{member.fullName}
									<span class="text-muted-foreground ml-1 italic">@{member.username}</span>
								</li>
							{/each}
						</ul>
					</Card.Content>
					<Card.Footer>
						<!-- <Button
							href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${ticketQuery.data.ticket.ticket.repository}/issues/${ticketQuery.data.ticket.ticket.issueNumber}`}
							variant="link"
							target="_blank"
							class="px-0"
							><GithubIcon class=" fill-primary !size-5" />{ticketQuery.data.ticket.ticket
								.repository}#{ticketQuery.data.ticket.ticket.issueNumber}
						</Button> -->
					</Card.Footer>
				</Card.Card>
				<!-- yeet -->
			</Card.Content>
			<Card.Footer><Button href="/admin/teams" variant="outline">Close</Button></Card.Footer>
		</Card.Card>
	</div>
{:else}
	<div class="col-span-1 col-start-4 row-span-3 row-start-1 grid place-content-center">
		<p class="text-muted-foreground italic">Select a ticket to view details</p>
	</div>
{/if}
