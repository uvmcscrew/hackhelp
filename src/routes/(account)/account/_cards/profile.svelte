<svelte:options runes={true} />

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import WarningAlert from '$lib/components/warning-alert.svelte';
	import type { RouterOutputs } from '$lib/orpc/server';
	import ProfileInitialize from '../_components/profile-initialize.svelte';
	import ProfileForm from '../_components/profile-form.svelte';

	type Props = {
		initialData: {
			canCreateProfile: boolean;
			profile: RouterOutputs['account']['profile']['get'];
		};
	};

	let { initialData }: Props = $props();

	const profileQuery = createQuery(() =>
		orpc.account.profile.get.queryOptions({
			initialData: initialData.profile
		})
	);

	const canCreateProfileQuery = createQuery(() =>
		orpc.account.profile.canInitialize.queryOptions({
			initialData: initialData.canCreateProfile,
			enabled: profileQuery.data === null
		})
	);

	const profileCardViewState = $derived.by(() => {
		if (profileQuery.data !== null) {
			return 'form';
		}

		if (canCreateProfileQuery.data) {
			return 'initialize';
		}

		return 'no';
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Your Profile</Card.Title>
		<Card.Description
			>Set important information related to your participation in the hackathon.</Card.Description
		>
	</Card.Header>
	{#if profileCardViewState === 'form' && profileQuery.data}
		<ProfileForm initialProfile={profileQuery.data} />
	{:else if profileCardViewState === 'initialize'}
		<ProfileInitialize />
	{:else if profileCardViewState === 'no'}
		<Card.Content>{@render noAutoVerifyAlert()}</Card.Content>
	{:else}
		<Card.Content class="text-muted-foreground italic">Loading</Card.Content>
	{/if}
</Card.Root>

{#snippet noAutoVerifyAlert()}
	<WarningAlert title="Your account cannot request verification">
		<div class="mt-2 text-sm">
			<p>
				To be automatically verified, your account must have a linked UVM NetID profile or an email
				address associated with Middlebury College or Champlain College.
			</p>
			<p>
				Mentors, judges, and other event participants can contact the hackathon organizers to have
				their account manually approved.
			</p>
		</div>

		<div class="mt-2 text-sm">
			<strong class="text-semibold">Getting your profile verified will:</strong>
			<ul class="list-disc">
				<li>Make you eligible to participate in the hackathon</li>
				<li>Enable access to resources on GitHub</li>
				<li>Allow you to join or create teams</li>
			</ul>
		</div>
	</WarningAlert>
{/snippet}
