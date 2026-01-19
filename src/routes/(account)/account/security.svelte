<svelte:options runes={true} />

<script lang="ts">
	import { authClient } from '$lib/auth/client.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import Trash from 'lucide-svelte/icons/trash';
	import { createMutation, createQuery } from '@tanstack/svelte-query';

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

<Tabs.Root value="passkeys">
	<Tabs.List>
		<Tabs.Trigger value="account">Account</Tabs.Trigger>
		<Tabs.Trigger value="passkeys">Passkeys</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="account">
		<Card.Root>
			<Card.Header>
				<Card.Title>Account</Card.Title>
				<Card.Description>
					Make changes to your account here. Click save when you&apos;re done.
				</Card.Description>
			</Card.Header>
			<Card.Content class="grid gap-6"></Card.Content>
			<Card.Footer>
				<Button>Save changes</Button>
			</Card.Footer>
		</Card.Root>
	</Tabs.Content>
	<Tabs.Content value="passkeys">
		<Card.Root>
			<Card.Header>
				<Card.Title>Passkeys</Card.Title>
				<Card.Description>Add passkeys as an additional login method.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Table.Root class="max-w-full">
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-max">Name</Table.Head>
							<Table.Head class="sr-only w-min">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					{#if !passkeyQuery.data && passkeyQuery.status !== 'success'}
						{#if passkeyQuery.status === 'pending'}
							<Table.Row class="text-muted-foreground italic"
								><Table.Cell>Loading passkeys...</Table.Cell> <Table.Cell />
							</Table.Row>
						{:else if passkeyQuery.status === 'error'}
							<Table.Row class="text-muted-foreground italic"
								><Table.Cell>Cannot load passkeys</Table.Cell> <Table.Cell /></Table.Row
							>
						{/if}
					{:else}
						<Table.Body>
							{#each passkeyQuery.data as passkey (passkey.id)}
								<Table.Row>
									<Table.Cell class="w-max">{passkey.name}</Table.Cell>
									<Table.Cell class=""
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
									><Table.Cell>No passkeys registered</Table.Cell></Table.Row
								>
							{/if}
						</Table.Body>
					{/if}
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
			</Card.Footer>
		</Card.Root>
	</Tabs.Content>
</Tabs.Root>
