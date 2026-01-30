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

	let accountQuery = createQuery(() => accountsQueryOptions);

	let githubAccount = $derived.by(() => {
		let providerAccounts = accountQuery.data
			? accountQuery.data.filter((acc) => acc.providerId === 'github')
			: [];
		return providerAccounts.length === 0 ? null : providerAccounts[0];
	});

	let githubProfile = createQuery(() =>
		orpc.account.getGitHubProfile.queryOptions({
			enabled: !(githubAccount == null)
		})
	);

	let linkMutation = createMutation(() => ({
		mutationKey: ['auth', 'accounts', 'github', 'link'],
		// TODO Figure out which GitHub OAuth scopes are required to auto-accept org invites on behalf of the user
		mutationFn: () =>
			authClient.linkSocial({
				provider: 'github',
				errorCallbackURL: '/auth/error?provider=github',
				callbackURL: '/account'
			}),
		onSettled: async (_d, _e, _v, _r, ctx) =>
			await Promise.allSettled([
				ctx.client.invalidateQueries({ queryKey: accountsQueryOptions.queryKey }),
				ctx.client.invalidateQueries({ queryKey: orpc.account.getGitHubProfile.queryKey() })
			])
	}));

	let addSelfToOrgMutation = createMutation(() =>
		orpc.account.addGitHubUserToOrg.mutationOptions({
			onSettled: async (_d, _e, _v, _r, ctx) =>
				await Promise.allSettled([
					ctx.client.invalidateQueries({ queryKey: orpc.account.getGitHubProfile.queryKey() })
				])
		})
	);

	let unlinkMutation = createMutation(() =>
		orpc.account.unlinkGitHubAccount.mutationOptions({
			onSettled: async (_d, _e, _v, _r, ctx) =>
				await Promise.allSettled([
					ctx.client.invalidateQueries({ queryKey: accountsQueryOptions.queryKey }),
					ctx.client.invalidateQueries({ queryKey: orpc.account.getGitHubProfile.queryKey() })
				])
		})
	);

	let setGithubPfpMutation = createMutation(() =>
		orpc.account.setProfilePhotoToGithub.mutationOptions({
			onSettled: async (_d, _e, _v, _r, ctx) =>
				await Promise.allSettled([ctx.client.invalidateQueries({ queryKey: ['auth', 'user'] })])
		})
	);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>GitHub</Card.Title>
		<Card.Description
			>Link your GitHub account to gain access to programming resources.</Card.Description
		>
	</Card.Header>
	{#if accountQuery.status === 'success'}
		{#if githubAccount}
			{#if linkMutation.isSuccess}
				<Confetti delay={[0, 500]} />
			{/if}
			<Card.Content class="flex flex-col">
				<div class="flex gap-x-2">
					<Avatar.Root class="h-16 w-16">
						<Avatar.Image src={githubProfile.data?.profile?.avatar} alt="User avatar" />
						<!-- <Avatar.Fallback><CircleUser class="h-16 w-16" /></Avatar.Fallback> -->
					</Avatar.Root>
					<div class="basis-full">
						<h2 class="font-semibold">{githubProfile.data?.profile?.fullName}</h2>
						<Button variant="link" class="text-muted-foreground m-0 p-0 font-mono"
							>{githubProfile.data?.profile?.username}</Button
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
					<Badge>{githubProfile.data?.orgStatus}</Badge>
				</div>
				{#if githubProfile.data?.orgStatus !== 'joined'}
					<Button
						class="mt-2 w-min"
						onclick={async () => await addSelfToOrgMutation.mutateAsync({})}
						disabled={addSelfToOrgMutation.isPending}
						>{#if addSelfToOrgMutation.isPending}
							<LoaderCircle class="h-6 w-auto animate-spin" />
						{/if} Join Org</Button
					>
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
				{#if setGithubPfpMutation.isSuccess}
					<Confetti delay={[0, 500]} />
				{/if}
			</Card.Content>
		{:else}
			<Card.Content>
				<Button
					onclick={async () => await linkMutation.mutateAsync()}
					disabled={linkMutation.isPending}
				>
					{#if linkMutation.isPending}
						<LoaderCircle class="h-6 w-auto animate-spin" />
					{/if}
					Link Account</Button
				>
			</Card.Content>
		{/if}
	{:else}
		<Card.Content class="text-muted-foreground italic">Loading</Card.Content>
	{/if}
</Card.Root>
