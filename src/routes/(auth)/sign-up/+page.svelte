<script lang="ts">
	import { signIn } from '$lib/auth/client.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { CardDescription } from '$lib/components/ui/card';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardFooter from '$lib/components/ui/card/card-footer.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import ErrorBox from '../error-box.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let emailText = $state('');
	let loading = $state(false);
	let signUpError = $state<{
		message?: string;
		status: number;
		statusText: string;
	} | null>(null);

	async function uvmNetIdSignUp() {
		loading = true;
		const { data: _data, error } = await signIn.oauth2({
			providerId: 'uvm-netid',
			callbackURL: '/account',
			errorCallbackURL: '/auth/error',
			newUserCallbackURL: '/welcome',
			scopes: ['openid', 'email', 'profile'],
			disableRedirect: false,
			requestSignUp: true
		});
		if (error) signUpError = error;
	}

	async function emailSignUp() {
		loading = true;
		const { error } = await signIn.magicLink({
			email: emailText,
			callbackURL: '/account',
			errorCallbackURL: '/auth/error',
			newUserCallbackURL: '/welcome'
		});
		if (error) signUpError = error;
		await goto(resolve('/(auth)/sign-up/email-sent'));
		loading = false;
	}
</script>

<svelte:head>
	<title>Signup | HackHelp</title>
</svelte:head>

<CardContent>
	<div class="flex flex-col">
		<Button disabled={loading} aria-disabled={loading} onclick={uvmNetIdSignUp}
			>Sign up with UVM NetID</Button
		>
	</div>

	<div class="relative my-2">
		<div aria-hidden="true" class="absolute inset-0 flex items-center">
			<div class="w-full border-t"></div>
		</div>
		<div class="relative flex justify-center text-sm/6 font-medium">
			<span class=" bg-card px-6">or</span>
		</div>
	</div>
	<form class="flex flex-col gap-y-2" onsubmit={emailSignUp}>
		<Label>Email</Label>
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
			>Email me a sign up link</Button
		>
	</form>

	{#if signUpError}
		<ErrorBox error={signUpError} />
	{/if}
</CardContent>

<CardFooter class="inline-flex items-center">
	<CardDescription>
		If you have an account, please go <Button variant="link" class="ml-1 px-0 py-0" href="/login"
			>sign in <ArrowRight class="-ml-2" />
		</Button>
	</CardDescription>
</CardFooter>
