<svelte:options runes={true} />

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import WarningAlert from '$lib/components/warning-alert.svelte';
	import type { RouterOutputs } from '$lib/orpc/server';
	import ProfileInitialize from '../_components/profile-initialize.svelte';
	import ProfileForm from '../_components/profile-form.svelte';
	import ProfileInitializeMlh from '../_components/profile-initialize-mlh.svelte';
	import ProfileMlhSync from '../_components/profile-mlh-sync.svelte';
	import { accountsQueryOptions } from './accounts';
	import type { UserAccounts } from '$lib/auth/server.server';
	import { authClient } from '$lib/auth/client.svelte';
	import { Button } from '$lib/components/ui/button';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';

	type Props = {
		initialData: {
			canCreateProfile: boolean;
			profile: RouterOutputs['account']['profile']['get'];
			accounts: UserAccounts;
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

	const accountQuery = createQuery(() => ({
		...accountsQueryOptions,
		initialData: initialData.accounts
	}));

	const hasMlhAccount = $derived(
		accountQuery.data?.some((acc) => acc.providerId === 'mlh') ?? false
	);

	const mlhLinkMutation = createMutation(() => ({
		mutationKey: ['auth', 'accounts', 'mlh', 'link'],
		mutationFn: () =>
			authClient.oauth2.link({
				providerId: 'mlh',
				callbackURL: '/account',
				errorCallbackURL: '/auth/error?provider=mlh'
			})
	}));

	/**
	 * View states:
	 *  - 'mlh-sync'       — has MLH + has profile → show sync button only
	 *  - 'mlh-initialize' — has MLH + no profile  → show MLH one-click create
	 *  - 'form'           — no MLH + has profile  → show regular profile form
	 *  - 'initialize'     — no MLH + can create   → show role-picker initialize
	 *  - 'no'             — not eligible at all
	 */
	const profileCardViewState = $derived.by(() => {
		if (profileQuery.data !== null) {
			return hasMlhAccount ? 'mlh-sync' : 'form';
		}
		if (hasMlhAccount) return 'mlh-initialize';
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
	{#if profileCardViewState === 'mlh-sync' && profileQuery.data}
		<ProfileMlhSync />
	{:else if profileCardViewState === 'mlh-initialize'}
		<ProfileInitializeMlh />
	{:else if profileCardViewState === 'form' && profileQuery.data}
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
				To be automatically verified, your account must have a linked UVM NetID profile, a linked
				MLH account, or an email address associated with Middlebury College or Champlain College.
			</p>
		</div>

		<div class="mt-3 text-sm">
			<strong>Are you a student competitor?</strong>
			<p class="text-muted-foreground mt-1">
				Link your MLH (Major League Hacking) account to get verified instantly and set up your
				profile.
			</p>
			<Button
				class="mt-2"
				onclick={async () => await mlhLinkMutation.mutateAsync()}
				disabled={mlhLinkMutation.isPending}
			>
				{#if mlhLinkMutation.isPending}
					<LoaderCircle class="h-4 w-auto animate-spin" />
				{/if}
				Link MLH account
			</Button>
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
