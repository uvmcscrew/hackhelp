<script lang="ts">
	import { CardContent, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import MadeWith from '$lib/components/MadeWith.svelte';
	import { Card } from '$lib/components/ui/card';
	import { authClient, useSession } from '$lib/auth/client.svelte';
	import { page } from '$app/state';
	import { capitalize } from 'es-toolkit/string';
	import { words } from 'es-toolkit/compat';
	import { Button } from '$lib/components/ui/button';
	import { errorExplanations } from './errors';

	let errorParam = $derived(page.url.searchParams.get('error') ?? '');

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
				return errorExplanations[errorParam as keyof typeof errorExplanations];
			}
			return null;
		}
		return null;
	});

	let session = useSession();
</script>

<div class="flex h-screen w-screen flex-col place-content-center items-center bg-inherit px-2">
	<Card class="w-full sm:w-1/2 lg:w-1/3">
		<CardHeader>
			<CardTitle>Oh No! An Error Occurred :(</CardTitle>
		</CardHeader>

		<CardContent>
			<div class="mt-4 rounded-md bg-red-500/15 p-4 outline outline-red-500/25">
				<div class="flex">
					<div class="shrink-0">
						<svg
							viewBox="0 0 20 20"
							fill="currentColor"
							data-slot="icon"
							aria-hidden="true"
							class="size-5 text-red-400"
						>
							<path
								d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
								clip-rule="evenodd"
								fill-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-200">{errorTitle}</h3>
						{#if errorDescription}
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
					</div>
				</div>
			</div>
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
