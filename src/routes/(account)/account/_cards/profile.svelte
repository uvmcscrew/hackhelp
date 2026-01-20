<svelte:options runes={true} />

<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';

	const qc = useQueryClient();

	const profilePermissionQuery = createQuery(orpc.account.canCreateProfile.queryOptions);
	const canRequestVerificationQuery = createQuery(() =>
		orpc.account.canRequestVerification.queryOptions({
			enabled: profilePermissionQuery.data === false
		})
	);
	const requestVerificationMutation = createMutation(() =>
		orpc.account.requestVerification.mutationOptions({
			onSuccess: async (isVerified) => {
				if (isVerified) {
					await qc.invalidateQueries({ queryKey: orpc.account.canCreateProfile.queryKey() });
				}
			}
		})
	);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Your Profile</Card.Title>
		<Card.Description
			>Set important information related to your participation in the hackathon.</Card.Description
		>
	</Card.Header>
	{#if profilePermissionQuery.data === true}
		<Card.Content>Yippee!</Card.Content>
	{:else if profilePermissionQuery.data === false && canRequestVerificationQuery.status === 'success'}
		{#if canRequestVerificationQuery.data}
			<Card.Content>
				<p class="mb-2">Your account can request automatic verification!</p>
				<Button
					onclick={requestVerificationMutation.mutateAsync}
					disabled={requestVerificationMutation.isPending}
					aria-disabled={requestVerificationMutation.isPending}
					>{#if requestVerificationMutation.isPending}
						<LoaderCircle class="h-6 w-auto animate-spin" />
					{/if} Request Verification</Button
				>
			</Card.Content>
		{:else}
			<Card.Content>
				<div class="rounded-md bg-yellow-500/10 p-4 outline outline-yellow-500/15">
					<div class="flex">
						<div class="shrink-0">
							<svg
								viewBox="0 0 20 20"
								fill="currentColor"
								data-slot="icon"
								aria-hidden="true"
								class="size-5 text-yellow-300"
							>
								<path
									d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
									clip-rule="evenodd"
									fill-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-yellow-100">
								Your account cannot request verification
							</h3>
							<div class="mt-2 text-sm text-yellow-100/80">
								<p>
									To be automatically verified, your account must have a linked UVM NetID profile or
									an email address associated with Middlebury College or Champlain College.
								</p>
								<p>
									Mentors, judges, and other event participants can contact the hackathon organizers
									to have their account manually approved.
								</p>
							</div>
						</div>
					</div>
				</div>
			</Card.Content>
		{/if}
	{:else}
		<Card.Content class="text-muted-foreground italic">Loading</Card.Content>
	{/if}
</Card.Root>
