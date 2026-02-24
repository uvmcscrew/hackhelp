<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CardContent } from '$lib/components/ui/card';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';

	const qc = useQueryClient();

	const initMutation = createMutation(() =>
		orpc.account.profile.initializeFromMlh.mutationOptions({
			onSuccess: async () => {
				await Promise.allSettled([
					qc.invalidateQueries({ queryKey: ['auth', 'user'] }),
					qc.invalidateQueries({ queryKey: orpc.account.profile.get.queryKey() }),
					qc.invalidateQueries({ queryKey: orpc.account.profile.canInitialize.queryKey() })
				]);
			}
		})
	);
</script>

<CardContent>
	<p class="text-muted-foreground mb-3 text-sm">
		Your MLH account is linked. You can set up your competitor profile automatically using your MLH
		information.
	</p>
	<Button
		onclick={async () => await initMutation.mutateAsync({})}
		disabled={initMutation.isPending}
		aria-disabled={initMutation.isPending}
	>
		{#if initMutation.isPending}
			<LoaderCircle class="h-4 w-auto animate-spin" />
		{/if}
		Create profile from MLH
	</Button>
</CardContent>
