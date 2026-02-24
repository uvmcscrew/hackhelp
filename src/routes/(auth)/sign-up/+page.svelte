<script lang="ts">
	import { authClient } from '$lib/auth/client.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { CardDescription } from '$lib/components/ui/card';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardFooter from '$lib/components/ui/card/card-footer.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { createMutation } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import ErrorAlert from '$lib/components/error-alert.svelte';

	let uvmNetIdSignUpMutation = createMutation(() => ({
		mutationFn: async () => {
			await authClient.signIn.oauth2({
				providerId: 'uvm-netid',
				callbackURL: '/account',
				errorCallbackURL: '/auth/error',
				newUserCallbackURL: '/account',
				scopes: ['openid', 'email', 'profile'],
				disableRedirect: false,
				requestSignUp: true,
				fetchOptions: {
					throw: true
				}
			});
		}
	}));

	let mlhSignUpMutation = createMutation(() => ({
		mutationFn: async () => {
			await authClient.signIn.oauth2({
				providerId: 'mlh',
				callbackURL: '/account',
				errorCallbackURL: '/auth/error?provider=mlh',
				newUserCallbackURL: '/account',
				disableRedirect: false,
				requestSignUp: true,
				fetchOptions: {
					throw: true
				}
			});
		}
	}));

	let emailSignUpMutation = createMutation(() => ({
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
			await goto(resolve('/(auth)/sign-up/email-sent'));
		}
	}));

	let loading = $derived(
		emailSignUpMutation.isPending || uvmNetIdSignUpMutation.isPending || mlhSignUpMutation.isPending
	);
</script>

<svelte:head>
	<title>Signup | HackHelp</title>
</svelte:head>

<CardContent>
	<div class="flex flex-col gap-y-2">
		<Button
			disabled={loading}
			aria-disabled={loading}
			onclick={async () => await uvmNetIdSignUpMutation.mutateAsync()}
			>{#if uvmNetIdSignUpMutation.isPending}<LoaderCircle class="h-6 w-auto animate-spin" />
			{/if}Sign up with UVM NetID</Button
		>
		<Button
			disabled={loading}
			aria-disabled={loading}
			variant="secondary"
			onclick={async () => await mlhSignUpMutation.mutateAsync()}
			>{#if mlhSignUpMutation.isPending}<LoaderCircle class="h-6 w-auto animate-spin" />
			{/if}Sign up with MLH</Button
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
	<form class="flex flex-col gap-y-2" onsubmit={emailSignUpMutation.mutate}>
		<Label>Email</Label>
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
			>{#if emailSignUpMutation.isPending}<LoaderCircle class="h-6 w-auto animate-spin" />
			{/if} Email me a sign up link</Button
		>
	</form>

	{#if emailSignUpMutation.error}
		<ErrorAlert class="mt-2" title={emailSignUpMutation.error.message}>
			{@const errorCauseMessage = emailSignUpMutation.error.cause
				? (emailSignUpMutation.error.cause as { message: string }).message
				: null}
			{#if errorCauseMessage}{errorCauseMessage}{/if}
		</ErrorAlert>
	{/if}
</CardContent>

<CardFooter class="inline-flex items-center">
	<CardDescription>
		If you have an account, please go <Button variant="link" class="ml-1 px-0 py-0" href="/login"
			>sign in <ArrowRight class="-ml-2" />
		</Button>
	</CardDescription>
</CardFooter>
