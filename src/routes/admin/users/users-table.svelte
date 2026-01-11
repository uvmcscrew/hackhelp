<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import queries from '$lib/trpc/client/queries.svelte';
	import type { RouterOutputs } from '$lib/trpc/server';
	import type { PageProps } from './$types';
	import CheckIcon from 'lucide-svelte/icons/check';
	import XIcon from 'lucide-svelte/icons/x';
	import UserRoundCheckIcon from 'lucide-svelte/icons/user-round-check';
	import mutations from '$lib/trpc/client/mutations.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	type UserData = RouterOutputs['admin']['users']['all'];

	type Props = {
		users: UserData;
	};

	let props: Props = $props();

	let users = queries.adminListAllUsers(props.users);
	let whitelistUserMutation = mutations.adminWhitelistUser();
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-min">Full Name</Table.Head>
			<Table.Head class="w-min">Username</Table.Head>
			<Table.Head class="w-min">Email</Table.Head>
			<Table.Head class="w-32">Role</Table.Head>

			<Table.Head class="w-[100px]">Whitelisted</Table.Head>
			<Table.Head class=" w-36">Joined Team</Table.Head>
			<Table.Head></Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#if users.data}
			{#each users.data.users as user}
				<Table.Row>
					<Table.Cell class="font-medium"
						>{user.profile && user.profile.givenName
							? user.profile.givenName
							: `${user.user.fullName} (GitHub)`}</Table.Cell
					>
					<Table.Cell>{user.user.username}</Table.Cell>
					<Table.Cell>{user.profile?.email}</Table.Cell>
					<Table.Cell>{user.profile?.role ?? 'unknown'}</Table.Cell>
					<Table.Cell>
						{#if user.profile?.isWhitelisted}
							<CheckIcon class="h-5 w-5 text-green-500" />
						{:else}
							<XIcon class="h-5 w-5 text-red-500" />
						{/if}
					</Table.Cell>
					<Table.Cell>
						{#if user.user.teamId !== null}
							<CheckIcon class="h-5 w-5 text-green-500" />
						{:else}
							<XIcon class="h-5 w-5 text-red-500" />
						{/if}
					</Table.Cell>
					<Table.Cell>
						<Button
							onclick={async () => {
								await whitelistUserMutation.mutateAsync({ userId: user.user.id });
							}}
							disabled={whitelistUserMutation.isPending || user.profile?.isWhitelisted}
							variant="outline"
							size="icon"><UserRoundCheckIcon /></Button
						>
					</Table.Cell>
				</Table.Row>
			{/each}
		{/if}
	</Table.Body>
</Table.Root>
