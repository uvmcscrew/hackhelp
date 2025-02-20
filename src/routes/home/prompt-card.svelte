<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import queries from '$lib/trpc/client/queries.svelte';
	import type { RouterOutputs } from '$lib/trpc/server';
</script>

<Card.Root class="col-span-1 col-start-1 row-span-1 row-start-2">
	<Card.Header>
		<Card.Title>Your Prompt</Card.Title>
	</Card.Header>
	<Card.Content>No prompt selected?</Card.Content>
	<Card.Footer class="grid w-fit grid-cols-2 grid-rows-3"></Card.Footer>
</Card.Root>
