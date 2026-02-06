<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	type Props = {};

	let {}: Props = $props();
</script>

<Table.Root>
	<Table.Caption>Users</Table.Caption>
	<Table.Header>
		<Table.Row>
			<Table.Cell>Name</Table.Cell>
			<Table.Cell>Email</Table.Cell>
			<Table.Cell>Role</Table.Cell>
			<Table.Cell>Status</Table.Cell>
		</Table.Row>
	</Table.Header>
</Table.Root>
