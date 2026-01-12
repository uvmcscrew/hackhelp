<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import XIcon from 'lucide-svelte/icons/x';
	import CheckIcon from 'lucide-svelte/icons/check';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { Debounced } from 'runed';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';

	let sheetOpen = $state(false);

	let inputSlug = $state('');
	let inputSlugDebounced = new Debounced(() => inputSlug, 500);

	let repoSlugValidQuery = createQuery(() =>
		orpc.competitor.repositories.repoSlugIsTaken.queryOptions({
			input: { repoName: inputSlugDebounced },
			enabled: sheetOpen
		})
	);

	let reposQuery = createQuery(orpc.competitor.repositories.getAll.queryOptions);

	let createRepoMutation = createMutation(orpc.competitor.repositories.create.mutationOptions);

	let isValid = $derived(
		repoSlugValidQuery.data?.repoExists === false && inputSlugDebounced.current.length > 1
	);
</script>

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Trigger
		disabled={reposQuery.data ? reposQuery.data.repos.length >= 3 : true}
		class={buttonVariants({ variant: 'default', size: 'sm' })}
	>
		Create Repository
	</Sheet.Trigger>
	<Sheet.Content side="right">
		<Sheet.Header>
			<Sheet.Title>Create Repository</Sheet.Title>
			<Sheet.Description>Create a new repository for your team</Sheet.Description>
		</Sheet.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 grid-rows-2 items-center gap-4">
				<Label for="name" class="row-start-1 text-right">Repo Slug</Label>
				<Input
					disabled={createRepoMutation.isPending}
					autocomplete="off"
					id="name"
					bind:value={inputSlug}
					class="col-span-3 row-start-2"
				/>
				<span class="col-start-4 row-start-2">
					{#if repoSlugValidQuery.isFetching}
						<LoaderCircle class="h-6 w-6 animate-spin" />
					{:else if repoSlugValidQuery.data}
						{#if repoSlugValidQuery.data.repoExists}
							<XIcon class="h-6 w-6 stroke-red-500" />
						{:else}
							<CheckIcon class="h-6 w-6 stroke-green-500" />
						{/if}
					{:else if !isValid}
						<XIcon class="h-6 w-6 stroke-red-500" />
					{/if}
				</span>
			</div>
		</div>
		<Sheet.Footer class="sm:justify-start">
			<Button
				disabled={!isValid || createRepoMutation.isPending}
				onclick={async () => {
					await createRepoMutation.mutateAsync({ repoName: inputSlugDebounced.current });
					sheetOpen = false;
				}}
			>
				{#if createRepoMutation.isPending}
					Creating <LoaderCircle class="ml-2 h-6 w-6 animate-spin" />
				{:else}
					Create Repository
				{/if}
			</Button>
			<Sheet.Close class={buttonVariants({ variant: 'outline' })}>Close</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
