<script lang="ts">
	import { sessionQueryOptions } from '$lib/auth/client.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import PencilLine from 'lucide-svelte/icons/pencil-line';

	const qc = useQueryClient();

	const sessionQuery = createQuery(() => sessionQueryOptions);

	let editing = $state(false);
	let nameField = $state(sessionQuery.data?.user.name || '');

	const updateNameMutation = createMutation(() =>
		orpc.account.updateName.mutationOptions({
			onSuccess: async () => {
				await qc.invalidateQueries({ queryKey: sessionQueryOptions.queryKey });
			}
		})
	);
</script>

{#if editing}
	<Input
		bind:value={nameField}
		disabled={updateNameMutation.isPending}
		aria-disabled={updateNameMutation.isPending}
		placeholder="Your name"
	/>
	<Button
		onclick={async () => {
			await updateNameMutation.mutateAsync({ newName: nameField });
			editing = false;
		}}
		disabled={updateNameMutation.isPending}
		aria-disabled={updateNameMutation.isPending}
		size="sm">Save</Button
	>
{:else if (sessionQuery.data?.user.name || '').length === 0}
	<Button
		onclick={() => {
			editing = true;
		}}
		variant="outline"
		size="sm">Set Name</Button
	>
{:else}
	<h2 class="min-h-4 text-lg font-medium">{sessionQuery.data?.user.name}</h2>
	<Button
		onclick={() => {
			editing = true;
		}}
		variant="outline"
		size="icon"><PencilLine class="h-auto w-auto" /><span class="sr-only">Edit Name</span></Button
	>
{/if}
