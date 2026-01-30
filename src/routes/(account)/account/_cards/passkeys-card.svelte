<svelte:options runes={true} />

<script lang="ts">
	import { authClient } from '$lib/auth/client.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import Trash from 'lucide-svelte/icons/trash';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import Confetti from 'svelte-confetti';

	let passkeyQuery = createQuery(() => ({
		queryKey: ['auth', 'passkeys'],
		queryFn: () => authClient.passkey.listUserPasskeys().then((r) => r.data)
	}));

	// Mutation code for adding a new passkey
	let addPasskeyNameField = $state('');
	let addPasskeyMutation = createMutation(() => ({
		mutationKey: ['auth', 'passkeys'],
		mutationFn: async (passkeyName: string) => {
			await authClient.passkey.addPasskey({ name: passkeyName });
		},
		onSuccess: () => {
			addPasskeyNameField = '';
		},
		onSettled: async (_data, _error, _vars, _res, context) => {
			await context.client.invalidateQueries({ queryKey: ['auth', 'passkeys'] });
		}
	}));
	let addPasskeyButtonDisabled = $derived(
		addPasskeyMutation.isPending || addPasskeyNameField.length === 0
	);

	// Mutation code for deleting a passkey
	let deletePasskeyMutation = createMutation(() => ({
		mutationKey: ['auth', 'passkeys'],
		mutationFn: async (passkeyId: string) => {
			await authClient.passkey.deletePasskey({ id: passkeyId });
		},
		onSettled: async (_data, _error, _vars, _res, context) => {
			await context.client.invalidateQueries({ queryKey: ['auth', 'passkeys'] });
		}
	}));
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Passkeys</Card.Title>
		<Card.Description>Add passkeys as an additional login method.</Card.Description>
	</Card.Header>
	<Card.Content>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head class="sr-only">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if !passkeyQuery.data && passkeyQuery.status !== 'success'}
					{#if passkeyQuery.status === 'pending'}
						<Table.Row class="text-muted-foreground italic"
							><Table.Cell>Loading passkeys...</Table.Cell> <Table.Cell />
						</Table.Row>
					{:else if passkeyQuery.status === 'error'}
						<Table.Row class="text-muted-foreground italic"
							><Table.Cell>Cannot load passkeys</Table.Cell>
							<Table.Cell /></Table.Row
						>
					{/if}
				{:else}
					{#each passkeyQuery.data as passkey (passkey.id)}
						<Table.Row>
							<Table.Cell>{passkey.name}</Table.Cell>
							<Table.Cell
								><Button
									class="ml-auto"
									variant="destructive"
									size="icon"
									onclick={async () => await deletePasskeyMutation.mutateAsync(passkey.id)}
									disabled={deletePasskeyMutation.isPending}
									aria-disabled={deletePasskeyMutation.isPending}><Trash /></Button
								></Table.Cell
							>
						</Table.Row>
					{/each}
					{#if passkeyQuery.data && passkeyQuery.data.length === 0}
						<Table.Row class="text-muted-foreground italic"
							><Table.Cell>No passkeys registered</Table.Cell><Table.Cell /></Table.Row
						>
					{/if}
				{/if}
			</Table.Body>
		</Table.Root>
	</Card.Content>
	<Card.Footer class="gap-x-2">
		<Input
			placeholder="Passkey Name"
			bind:value={addPasskeyNameField}
			disabled={addPasskeyMutation.isPending}
			aria-disabled={addPasskeyMutation.isPending}
		/>
		<Button
			onclick={async () => await addPasskeyMutation.mutateAsync(addPasskeyNameField)}
			disabled={addPasskeyButtonDisabled}
			aria-disabled={addPasskeyButtonDisabled}>Register Passkey</Button
		>

		{#if addPasskeyMutation.isSuccess}
			<Confetti delay={[1500, 2000]} />
		{/if}
	</Card.Footer>
</Card.Root>
