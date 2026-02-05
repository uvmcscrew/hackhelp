<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth/client.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { CardDescription, CardFooter } from '$lib/components/ui/card';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { createMutation } from '@tanstack/svelte-query';
	import ErrorAlert from '$lib/components/error-alert.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { BetterFetchError } from '@better-fetch/fetch';

	let lastUsedMethod = null;
	// let lastUsedMethod = $derived(authClient.getLastUsedLoginMethod());

	let passkeySignInMutation = createMutation(() => ({
		mutationFn: async () => {
			const { error } = await authClient.signIn.passkey({
				autoFill: false,
				fetchOptions: {
					throw: true
				}
			});

			// When passkey auth gets cancelled it doesn't throw, but it should anyway to trigger the tanstack query mutation logic
			if (error) {
				throw new BetterFetchError(error.status, error.statusText, error);
			}
		},
		onSuccess: async () => {
			await goto(resolve('/(account)/account'));
		}
	}));

	let uvmNetIdSignInMutation = createMutation(() => ({
		mutationFn: async () => {
			await authClient.signIn.oauth2({
				providerId: 'uvm-netid',
				callbackURL: '/account',
				errorCallbackURL: '/auth/error?provider=uvm-netid',
				newUserCallbackURL: '/account',
				scopes: ['openid', 'email', 'profile'],
				disableRedirect: false,
				requestSignUp: false,
				fetchOptions: {
					throw: true
				}
			});
		}
	}));

	let emailSignInMutation = createMutation(() => ({
		mutationFn: async (
			event: SubmitEvent & {
				currentTarget: EventTarget & HTMLFormElement;
			}
		) => {
			event.preventDefault();

			const formData = new FormData(event.currentTarget);

			const email = (formData.get('email') as string) || '';

			await authClient.signIn.magicLink({
				email,
				callbackURL: '/account',
				errorCallbackURL: '/auth/error',
				newUserCallbackURL: '/account',
				fetchOptions: {
					throw: true
				}
			});
		},
		onSuccess: async () => {
			await goto(resolve('/(auth)/login/email-sent'));
		}
	}));

	let loading = $derived(
		emailSignInMutation.isPending ||
			uvmNetIdSignInMutation.isPending ||
			passkeySignInMutation.isPending
	);
</script>

<svelte:head>
	<title>Login | HackHelp</title>
</svelte:head>

<CardContent>
	<div class="relative flex flex-col gap-y-4">
		<Button
			disabled={loading}
			aria-disabled={loading}
			onclick={() => passkeySignInMutation.mutate()}
			>{#if passkeySignInMutation.isPending}<LoaderCircle class="h-6 w-auto animate-spin" />
			{/if}Sign In with Passkey
			{#if lastUsedMethod === 'passkey'}
				<Badge variant="secondary">Last Used</Badge>
			{/if}
		</Button>
		{#if passkeySignInMutation.error}
			<ErrorAlert title={passkeySignInMutation.error.message}>
				{@const errorCauseMessage = passkeySignInMutation.error.cause
					? (passkeySignInMutation.error.cause as { message: string }).message
					: null}
				{#if errorCauseMessage}{errorCauseMessage}{/if}
			</ErrorAlert>
		{/if}
		<Button
			disabled={loading}
			aria-disabled={loading}
			variant="secondary"
			onclick={() => uvmNetIdSignInMutation.mutate()}
			>{#if uvmNetIdSignInMutation.isPending}<LoaderCircle class="h-6 w-auto animate-spin" />
			{/if}Sign In with UVM NetID
			{#if lastUsedMethod === 'uvm-netid'}
				<Badge variant="yellow">Last Used</Badge>
			{/if}
		</Button>
	</div>

	<div class="relative my-2">
		<div aria-hidden="true" class="absolute inset-0 flex items-center">
			<div class="w-full border-t"></div>
		</div>
		<div class="relative flex justify-center text-sm/6 font-medium">
			<span class=" bg-card px-6">or</span>
		</div>
	</div>
	<form class="flex flex-col gap-y-2" onsubmit={emailSignInMutation.mutate}>
		<Label for="email">Email</Label>
		<Input
			id="email"
			name="email"
			type="email"
			autocomplete="email"
			minlength={1}
			disabled={loading}
			aria-disabled={loading}
		/>
		<Button type="submit" variant="secondary" disabled={loading} aria-disabled={loading}
			>{#if emailSignInMutation.isPending}<LoaderCircle class="h-6 w-auto animate-spin" />
			{/if}Email me a login link</Button
		>
	</form>

	{#if emailSignInMutation.error}
		<ErrorAlert class="mt-2" title={emailSignInMutation.error.message}>
			{@const errorCauseMessage = emailSignInMutation.error.cause
				? (emailSignInMutation.error.cause as { message: string }).message
				: null}
			{#if errorCauseMessage}{errorCauseMessage}{/if}
		</ErrorAlert>
	{/if}
</CardContent>

<CardFooter class="inline-flex items-center">
	<CardDescription>
		If you have not signed up for the hackathon, <br /> please go <Button
			variant="link"
			class="ml-1 px-0 py-0"
			href="/sign-up"
			>sign up <ArrowRight class="-ml-2" />
		</Button> <br />
		Last year's accounts were wiped.
	</CardDescription>
</CardFooter>
