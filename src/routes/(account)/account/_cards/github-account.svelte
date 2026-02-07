<script lang="ts">
	import { authClient } from '$lib/auth/client.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { accountsQueryOptions } from './accounts';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import Confetti from 'svelte-confetti';
	import { tick } from 'svelte';
	import { delay } from '$lib/utils';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import WarningAlert from '$lib/components/warning-alert.svelte';
	import type { UserAccounts } from '$lib/auth/server.server';

	type Props = {
		initialData: {
			accounts: UserAccounts;
		};
	};

	let { initialData }: Props = $props();

	let accountQuery = createQuery(() => ({
		...accountsQueryOptions,
		initialData: initialData.accounts
	}));

	let githubAccount = $derived.by(() => {
		let providerAccounts = accountQuery.data
			? accountQuery.data.filter((acc) => acc.providerId === 'github')
			: [];
		return providerAccounts.length === 0 ? null : providerAccounts[0];
	});

	let githubTokensStatus = createQuery(() =>
		orpc.account.checkGithubTokens.queryOptions({
			enabled: !(githubAccount === null)
		})
	);

	// If the user has a linked github account, we only disable this query if the refresh token is confirmed out of date. If the token status query hasn't resolved, we shouldn't block this query from fetching
	let enableGithubProfileQuery = $derived.by(() => {
		const hasLinkedGithub = !(githubAccount === null);
		const needsNewRefreshToken =
			githubTokensStatus.status === 'success' && githubTokensStatus.data.refreshTokenExpired;
		return hasLinkedGithub && !needsNewRefreshToken;
	});

	let githubProfile = createQuery(() =>
		orpc.account.getGitHubProfile.queryOptions({
			enabled: enableGithubProfileQuery
		})
	);

	let runConfetti = $state(false);

	let linkMutation = createMutation(() => ({
		mutationKey: ['auth', 'accounts', 'github', 'link'],
		mutationFn: () =>
			authClient.linkSocial({
				provider: 'github',
				errorCallbackURL: '/auth/error?provider=github',
				callbackURL: '/account?tab=github'
			}),
		onSettled: async (_d, _e, _v, _r, ctx) =>
			await Promise.allSettled([
				ctx.client.invalidateQueries({ queryKey: accountsQueryOptions.queryKey }),
				ctx.client.invalidateQueries({ queryKey: orpc.account.getGitHubProfile.queryKey() }),
				ctx.client.invalidateQueries({ queryKey: orpc.account.checkGithubTokens.queryKey() })
			])
	}));

	let addSelfToOrgMutation = createMutation(() =>
		orpc.account.addGitHubUserToOrg.mutationOptions({
			onSettled: async (_d, _e, _v, _r, ctx) => {
				await Promise.allSettled([
					ctx.client.invalidateQueries({ queryKey: orpc.account.getGitHubProfile.queryKey() })
				]);
				runConfetti = true;
			}
		})
	);

	let unlinkMutation = createMutation(() =>
		orpc.account.unlinkGitHubAccount.mutationOptions({
			onSettled: async (_d, _e, _v, _r, ctx) =>
				await Promise.allSettled([
					ctx.client.invalidateQueries({ queryKey: accountsQueryOptions.queryKey }),
					ctx.client.cancelQueries({ queryKey: orpc.account.getGitHubProfile.queryKey() }),
					ctx.client.cancelQueries({ queryKey: orpc.account.checkGithubTokens.queryKey() })
				])
		})
	);

	let setGithubPfpMutation = createMutation(() =>
		orpc.account.setProfilePhotoToGithub.mutationOptions({
			onSettled: async (_d, _e, _v, _r, ctx) => {
				await Promise.allSettled([ctx.client.invalidateQueries({ queryKey: ['auth', 'user'] })]);
				runConfetti = true;
			}
		})
	);

	$effect(
		() =>
			void (async () => {
				if (runConfetti) {
					await tick();
					await delay(5000);
					runConfetti = false;
				}
			})()
	);
</script>

{#snippet linkGithubButton()}
	<Button onclick={async () => await linkMutation.mutateAsync()} disabled={linkMutation.isPending}>
		{#if linkMutation.isPending}
			<LoaderCircle class="h-6 w-auto animate-spin" />
		{/if}
		Link Account</Button
	>
{/snippet}

<Card.Root>
	<Card.Header>
		<Card.Title>GitHub</Card.Title>
		<Card.Description
			>Link your GitHub account to gain access to programming resources.
		</Card.Description>
	</Card.Header>
	{#if accountQuery.status === 'success'}
		{#if githubAccount == null}
			<Card.Content>
				{@render linkGithubButton()}
			</Card.Content>
		{:else if githubAccount && githubProfile.status === 'success'}
			<Card.Content class="flex flex-col">
				<div class="flex gap-x-2">
					<Avatar.Root class="h-16 w-16">
						<Avatar.Image src={githubProfile.data.profile?.avatar} alt="User avatar" />
						<Avatar.Fallback><CircleUser class="h-16 w-16" /></Avatar.Fallback>
					</Avatar.Root>
					<div class="basis-full">
						<h2 class="font-semibold">{githubProfile.data.profile?.fullName}</h2>
						<Button variant="link" class="text-muted-foreground m-0 p-0 font-mono"
							>{githubProfile.data.profile?.username}</Button
						>
					</div>
					<div class="flex items-center justify-center">
						<Button
							onclick={async () => await unlinkMutation.mutateAsync({})}
							disabled={unlinkMutation.isPending}
							variant="destructive"
							>{#if unlinkMutation.isPending}
								<LoaderCircle class="h-6 w-auto animate-spin" />
							{/if}Unlink</Button
						>
					</div>
				</div>
				<div class="">
					<span class=" font-semibold">Organization Status: </span>
					<Badge>{githubProfile.data.orgStatus}</Badge>
				</div>
				{#if githubProfile.data.orgStatus !== 'joined'}
					<Button
						class="mt-2 w-min"
						onclick={async () => await addSelfToOrgMutation.mutateAsync({})}
						disabled={addSelfToOrgMutation.isPending}
						>{#if addSelfToOrgMutation.isPending}
							<LoaderCircle class="h-6 w-auto animate-spin" />
						{/if} Join Org</Button
					>
				{/if}

				{#if addSelfToOrgMutation.isSuccess}
					<div
						style="position: fixed; top: -50px; left: 0; height: 100vh; width: 100vw; display: flex; justify-content: center; overflow: hidden; pointer-events: none;"
					>
						<Confetti delay={[0, 500]} />
					</div>
				{/if}

				<Button
					variant="outline"
					class="mt-2 w-min"
					onclick={async () => await setGithubPfpMutation.mutateAsync({})}
					disabled={setGithubPfpMutation.isPending}
					>{#if setGithubPfpMutation.isPending}
						<LoaderCircle class="h-6 w-auto animate-spin" />
					{/if} Match profile photo to github</Button
				>
				{#if setGithubPfpMutation.isSuccess || addSelfToOrgMutation.isSuccess}
					<div
						style="position: fixed; top: -50px; left: 0; height: 100vh; width: 100vw; display: flex; justify-content: center; overflow: hidden; pointer-events: none;"
					>
						<Confetti
							x={[-5, 5]}
							y={[0, 0.1]}
							delay={[100, 2000]}
							amount={200}
							fallDistance="100vh"
						/>
					</div>
				{/if}
			</Card.Content>
		{:else if githubTokensStatus.data?.refreshTokenExpired}
			<Card.Content>
				<WarningAlert title="GitHub Reauthentication Required">
					<p class="mb-2">
						You may have already linked your GitHub account, but GitHub is requiring us to ask for
						your permission again. If you're trying to unlink your GitHub account, please
						reauthenticate first.
					</p>
					{@render linkGithubButton()}
				</WarningAlert>
			</Card.Content>
		{:else}
			<Card.Content class="text-muted-foreground italic">Loading GitHub profile...</Card.Content>
		{/if}
	{:else}
		<Card.Content class="text-muted-foreground italic">Loading</Card.Content>
	{/if}
</Card.Root>
