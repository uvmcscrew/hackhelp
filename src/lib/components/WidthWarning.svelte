<script lang="ts">
	import Badge from './ui/badge/badge.svelte';
	import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
</script>

<Badge
	hoverEffects={false}
	variant="destructive"
	class="inline-flex items-center min-[1112px]:hidden"
	><TriangleAlert class="mr-2 h-4 w-4" /> Please Use Wider Screen</Badge
>
