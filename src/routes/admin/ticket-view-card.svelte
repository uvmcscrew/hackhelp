<svelte:options runes />

<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { clientEnv } from '$lib/env/client';
	import queries from '$lib/trpc/client/queries.svelte';
	import { MarkGithub24 as GithubIcon } from 'svelte-octicons';

	let ticketId = $derived.by(() => {
		return page.url.searchParams.get('ticketId');
	});

	let ticketQuery = $derived(queries.adminGetTicketById(ticketId));
</script>

{#if ticketId && $ticketQuery.data}
	<div class="col-span-1 col-start-4 row-span-3 row-start-1 pt-11">
		<Card.Card class="h-full w-full">
			<Card.Header class="flex flex-row items-center justify-between">
				<Card.Title class="h-full">Ticket Viewer</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col justify-start gap-y-4">
				<!-- Repo information card -->
				<Card.Card class="h-full w-full">
					<Card.Header class="flex flex-row items-center justify-between">
						<Card.Title class="h-full">{$ticketQuery.data.ticket.ticket.title}</Card.Title>
					</Card.Header>
					<Card.Content class="flex flex-col justify-start gap-y-4"></Card.Content>
					<Card.Footer
						><Button
							href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${$ticketQuery.data.ticket.ticket.repository}/issues/${$ticketQuery.data.ticket.ticket.issueNumber}`}
							variant="link"
							class="px-0"
							><GithubIcon class=" fill-primary !size-5" />{$ticketQuery.data.ticket.ticket
								.repository}#{$ticketQuery.data.ticket.ticket.issueNumber}</Button
						></Card.Footer
					>
				</Card.Card>
				<!-- yeet -->
			</Card.Content>
			<Card.Footer
				><Button href="/admin" target="_blank" variant="outline">Close</Button></Card.Footer
			>
		</Card.Card>
	</div>
{:else}
	<div class="col-span-1 col-start-4 row-span-3 row-start-1 grid place-content-center">
		<p class="text-muted-foreground italic">Select a ticket to view details</p>
	</div>
{/if}
