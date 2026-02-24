<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CardContent } from '$lib/components/ui/card';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';

	const qc = useQueryClient();

	const syncMutation = createMutation(() =>
		orpc.account.profile.syncFromMlh.mutationOptions({
			onSuccess: async () => {
				await Promise.allSettled([
					qc.invalidateQueries({ queryKey: ['auth', 'user'] }),
					qc.invalidateQueries({ queryKey: orpc.account.profile.get.queryKey() })
				]);
			}
		})
	);
</script>

<CardContent class="flex flex-col gap-y-3">
	<p class="text-muted-foreground text-sm">
		Your profile is linked to your MLH account. Use the button below to sync your name from MLH.
	</p>
	<Button
		variant="outline"
		class="w-fit"
		onclick={async () => await syncMutation.mutateAsync({})}
		disabled={syncMutation.isPending}
	>
		{#if syncMutation.isPending}
			<LoaderCircle class="h-4 w-auto animate-spin" />
		{:else}
			<RefreshCw class="h-4 w-auto" />
		{/if}
		Sync from MLH
	</Button>
	{#if syncMutation.isSuccess && syncMutation.data.name}
		<p class="text-muted-foreground text-sm">
			Synced name: <strong>{syncMutation.data.name}</strong>
		</p>
	{/if}
</CardContent>
