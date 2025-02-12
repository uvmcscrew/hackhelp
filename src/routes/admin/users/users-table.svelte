<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import queries from '$lib/trpc/client/queries.svelte';
	import type { RouterOutputs } from '$lib/trpc/server';
	import type { PageProps } from './$types';

	type UserData = RouterOutputs['admin']['users']['all'];

	type Props = {
		users: UserData;
	};

	let pgProps: Props = $props();

	let users = queries.adminListAllUsers(pgProps.users);
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Full Name</Table.Head>
			<Table.Head>Username</Table.Head>
			<Table.Head>Email</Table.Head>
			<Table.Head class="w-[100px]">Whitelisted</Table.Head>
			<Table.Head></Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#if $users.data}
			{#each $users.data.users as user}
				<Table.Row>
					<Table.Cell class="font-medium">{user.user.fullName}</Table.Cell>
					<Table.Cell>{user.user.username}</Table.Cell>
					<Table.Cell>{user.person?.eduEmail}</Table.Cell>
					<Table.Cell class="text-right">$250.00</Table.Cell>
				</Table.Row>
			{/each}
		{/if}

		<Table.Row>
			<Table.Cell class="font-medium">INV001</Table.Cell>
			<Table.Cell>Paid</Table.Cell>
			<Table.Cell>Credit Card</Table.Cell>
			<Table.Cell class="text-right">$250.00</Table.Cell>
		</Table.Row>
	</Table.Body>
</Table.Root>
