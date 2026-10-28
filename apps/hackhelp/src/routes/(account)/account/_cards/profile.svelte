<svelte:options runes={true} />

<script lang="ts">
	import * as Card from '#lib/components/ui/card';
	import { orpc } from '#lib/orpc/client/index.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import WarningAlert from '#lib/components/warning-alert.svelte';
	import type { RouterOutputs } from '#lib/orpc/server';
	import ProfileInitialize from '../_components/profile-initialize.svelte';
	import ProfileForm from '../_components/profile-form.svelte';
	import { accountsQueryOptions } from './accounts';
	import type { UserAccounts } from '#lib/auth/server.server';
	import { sessionQueryOptions } from '#lib/auth/client.svelte';

	type Props = {
		initialData: {
			canCreateProfile: boolean;
			profile: RouterOutputs['account']['profile']['get'];
			accounts: UserAccounts;
		};
	};

	let { initialData }: Props = $props();

	const sessionQuery = createQuery(() => sessionQueryOptions);

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

	const accountQuery = createQuery(() => ({
		...accountsQueryOptions,
		initialData: initialData.accounts
	}));

	/**
	 * View states:
	 *  - 'form'           — has profile  → show regular profile form
	 *  - 'initialize'     — no profile + can create   → show role-picker initialize
	 *  - 'no'             — not eligible at all
	 */
	const profileCardViewState = $derived.by(() => {
		if (profileQuery.data !== null) {
			return 'form';
		}
		if (canCreateProfileQuery.data) return 'initialize';
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
		{#if ['admin', 'mentor', 'judge'].some((r) => (sessionQuery.data?.user.role || '')
				.split(',')
				.includes(r))}
			<ProfileInitialize />
		{/if}
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
				To be automatically verified, your account must have a linked UVM NetID profile, or an email address associated with Middlebury College or Champlain College.
			</p>
		</div>

		<div class="mt-3 text-sm">
			<strong>Are you a mentor, judge, or other participant?</strong>
			<p class="text-muted-foreground mt-1">
				Please contact the hackathon organizers to have your account manually approved.
			</p>
		</div>

		<div class="mt-3 text-sm">
			<strong class="text-semibold">Getting verified will:</strong>
			<ul class="list-disc">
				<li>Make you eligible to participate in the hackathon</li>
				<li>Enable access to resources on GitHub</li>
				<li>Allow you to join or create teams</li>
			</ul>
		</div>
	</WarningAlert>
{/snippet}
