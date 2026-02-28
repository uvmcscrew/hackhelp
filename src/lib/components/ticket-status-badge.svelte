<script lang="ts">
	import type { TicketResolutionStatus } from '$lib/server/db/schema';
	import { Badge } from './ui/badge';

	type Props = {
		status: TicketResolutionStatus;
	};

	let { status }: Props = $props();
</script>

{#if status === 'open'}
	<Badge hoverEffects={false} class="bg-uvm-gold w-fit text-black">Open</Badge>
{:else if status === 'claimed'}
	<Badge hoverEffects={false} class="w-fit bg-blue-600/80 text-white">Claimed</Badge>
{:else if status === 'inProgress'}
	<Badge hoverEffects={false} class="w-fit bg-purple-600/80 text-white">In Progress</Badge>
{:else if status === 'resolved'}
	<Badge hoverEffects={false} class="w-fit bg-green-600/80 text-white">Resolved</Badge>
{:else}
	<Badge hoverEffects={false} variant="outline">Unknown</Badge>
{/if}
