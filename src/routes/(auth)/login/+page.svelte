<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { signIn } from '$lib/auth/client.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { CardDescription, CardFooter } from '$lib/components/ui/card';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import ErrorBox from '../error-box.svelte';

	let emailText = $state('');
	let loading = $state(false);
	let signInError = $state<{
		message?: string;
		status: number;
		statusText: string;
	} | null>(null);
	let lastUsedMethod = null;
	// let lastUsedMethod = $derived(authClient.getLastUsedLoginMethod());

	async function passkeySignIn() {
		loading = true;
		console.log('Passkey signin');
		const { error } = await signIn.passkey({
			autoFill: false,
			fetchOptions: {
				async onSuccess(_context) {
					await goto(resolve('/(account)/account'));
				},
				onError(context) {
					console.error('Authentication failed:', context.error.message);
					signInError = context.error;
				}
			}
		});
		if (error) signInError = error;
		loading = false;
	}

	async function uvmNetIdSignIn() {
		loading = true;
		const { data: _data, error } = await signIn.oauth2({
			providerId: 'uvm-netid', // required
			callbackURL: '/account',
			errorCallbackURL: '/auth/error',
			newUserCallbackURL: '/welcome',
			scopes: ['openid', 'email', 'profile'],
			requestSignUp: false
		});
		if (error) signInError = error;
		loading = false;
	}

	async function emailSignIn() {
		loading = true;
		const { error } = await signIn.magicLink({
			email: emailText,
			callbackURL: '/account',
			errorCallbackURL: '/auth/error',
			newUserCallbackURL: '/welcome'
		});
		if (error) signInError = error;
		await goto(resolve('/(auth)/login/email-sent'));
		loading = false;
	}
</script>

<svelte:head>
	<title>Login | HackHelp</title>
</svelte:head>

<CardContent>
	<div class="relative flex flex-col gap-y-4">
		<Button disabled={loading} aria-disabled={loading} onclick={passkeySignIn}
			>Sign In with Passkey
			{#if lastUsedMethod === 'passkey'}
				<Badge variant="secondary">Last Used</Badge>
			{/if}
		</Button>
		<Button disabled={loading} aria-disabled={loading} variant="secondary" onclick={uvmNetIdSignIn}
			>Sign In with UVM NetID
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
	<form class="flex flex-col gap-y-2" onsubmit={emailSignIn}>
		<Label for="email">Email</Label>
		<Input
			id="email"
			name="email"
			type="email"
			autocomplete="email"
			minlength={1}
			bind:value={emailText}
			disabled={loading}
			aria-disabled={loading}
		/>
		<Button type="submit" variant="secondary" disabled={loading} aria-disabled={loading}
			>Email me a login link</Button
		>
	</form>

	{#if signInError}
		<ErrorBox error={signInError} />
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
