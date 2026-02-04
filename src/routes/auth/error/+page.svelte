<script lang="ts">
	import { CardContent, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import MadeWith from '$lib/components/MadeWith.svelte';
	import { Card } from '$lib/components/ui/card';
	import { authClient, sessionQueryOptions } from '$lib/auth/client.svelte';
	import { page } from '$app/state';
	import { capitalize } from 'es-toolkit/string';
	import { words } from 'es-toolkit/compat';
	import { Button } from '$lib/components/ui/button';
	import { errorExplanations } from './errors';
	import { createQuery } from '@tanstack/svelte-query';
	import ErrorAlert from '$lib/components/error-alert.svelte';

	let errorParam = $derived(page.url.searchParams.get('error') ?? '');
	let providerParam = $derived(page.url.searchParams.get('provider') ?? '');

	let errorTitle = $derived.by(() => {
		if (errorParam !== '') {
			if (Object.keys(authClient.$ERROR_CODES).includes(errorParam.toUpperCase())) {
				return authClient.$ERROR_CODES[errorParam as keyof typeof authClient.$ERROR_CODES];
			}
			return capitalize(words(errorParam).join(' '));
		}
		return 'An Unknown Error Ocurred';
	});

	let errorDescription = $derived.by(() => {
		if (errorParam !== '') {
			if (Object.keys(errorExplanations).includes(errorParam)) {
				return errorExplanations[errorParam as keyof typeof errorExplanations][
					providerParam === ''
						? 'default'
						: (providerParam as keyof (typeof errorExplanations)["email_doesn't_match"])
				];
			}
			return null;
		}
		return null;
	});

	let session = createQuery(() => sessionQueryOptions);
</script>

<div class="flex h-screen w-screen flex-col place-content-center items-center bg-inherit px-2">
	<Card class="w-full sm:w-1/2 lg:w-1/3">
		<CardHeader>
			<CardTitle>Oh No! An Error Occurred :(</CardTitle>
		</CardHeader>

		<CardContent>
			<ErrorAlert title={errorTitle}
				>{#if errorDescription}
					<p class="mt-2 text-sm text-red-200/80">
						{errorDescription}
					</p>
					<p class="mt-2 text-sm text-red-200/80">
						If this error persists, contact the hackathon organizers.
					</p>
				{:else}
					<p class="mt-2 text-sm text-red-200/80">
						Please try again, and if this error persists, contact the hackathon organizers.
					</p>
				{/if}
			</ErrorAlert>
		</CardContent>

		<CardFooter>
			{#if session.status === 'success'}
				{#if session.data === null}
					<Button variant="secondary" href="/login">Return to sign in</Button>
				{:else}
					<Button variant="secondary" href="/account">Return to account</Button>
				{/if}
			{:else if session.status === 'error'}
				<Button variant="secondary" href="/login">Return to sign in</Button>
			{/if}
		</CardFooter>
	</Card>

	<span class="absolute bottom-0 mb-2 inline-flex w-screen justify-center">
		<MadeWith />
	</span>
</div>
