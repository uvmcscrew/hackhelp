<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import queries from '$lib/trpc/client/queries.svelte';
	import mutations from '$lib/trpc/client/mutations.svelte';
	import { delay, MAX_TEAMS_PER_CHALLENGE } from '$lib/utils';
	import * as Card from '$lib/components/ui/card';

	let sheetOpen = $state(false);
	let submitting = $state(false);

	let challenges = $derived(queries.competitorGetChallenges(sheetOpen && !submitting));
	let challengeSelectMutation = mutations.teamSelectChallenge();

	let selectedChallengeId = $state('');
</script>

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Trigger class={buttonVariants({ variant: 'default', size: 'sm' })}
		>Select Challenge</Sheet.Trigger
	>
	<Sheet.Content side="right" class="font-mono">
		<Sheet.Header>
			<Sheet.Title>Select Challenge</Sheet.Title>
			<Sheet.Description
				>Your choice is not locked in until you click Submit at the bottom of this dialog.
			</Sheet.Description>
		</Sheet.Header>
		<div class="flex flex-col gap-y-2">
			{#if challenges.data}
				{#if challenges.data.challenges.length > 0}
					{#each challenges.data?.challenges as challenge}
						<Card.Root>
							<Card.Header>
								<Card.Title>{challenge.title}</Card.Title>
							</Card.Header>
							<Card.Content>
								{MAX_TEAMS_PER_CHALLENGE - challenge.teamsAssigned} slots remaining
							</Card.Content>
							<Card.Footer>
								<Button
									disabled={$challengeSelectMutation.isPending ||
										submitting ||
										selectedChallengeId === challenge.id}
									onclick={() => {
										selectedChallengeId = challenge.id;
									}}
									class="w-full"
								>
									{#if selectedChallengeId === challenge.id}
										Selected
									{:else}
										Select
									{/if}
								</Button>
							</Card.Footer>
						</Card.Root>
					{/each}
				{:else}
					<p>No challenges available.</p>
				{/if}
			{/if}
		</div>

		<Sheet.Footer class="mt-4 flex w-full justify-start gap-x-2">
			<Button
				disabled={$challengeSelectMutation.isPending || submitting}
				onclick={async () => {
					submitting = true;
					await challengeSelectMutation.mutateAsync({ challengeId: selectedChallengeId });
					await delay(1000);
					submitting = false;
					sheetOpen = false;
				}}
			>
				{#if $challengeSelectMutation.isPending || submitting}
					Submitting <LoaderCircle class="mr-2 size-4 animate-spin" />
				{:else}
					Submit
				{/if}
			</Button>
			<Sheet.Close class={buttonVariants({ variant: 'outline' })}>Close</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
