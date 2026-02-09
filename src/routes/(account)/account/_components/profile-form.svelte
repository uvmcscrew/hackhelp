<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CardContent, CardFooter } from '$lib/components/ui/card';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';

	const qc = useQueryClient();

	const updateProfileMutation = createMutation(() =>
		orpc.account.profile.update.mutationOptions({
			onSuccess: async () => {
				await qc.invalidateQueries({ queryKey: orpc.account.profile.get.queryKey() });
			}
		})
	);
</script>

<CardContent>Profile Form</CardContent>
<CardFooter
	><Button
		disabled={updateProfileMutation.isPending}
		aria-disabled={updateProfileMutation.isPending}
		>{#if updateProfileMutation.isPending}
			<LoaderCircle class="h-6 w-auto animate-spin" />
		{/if}Save</Button
	></CardFooter
>
