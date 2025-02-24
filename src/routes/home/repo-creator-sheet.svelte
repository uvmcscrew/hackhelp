<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import XIcon from 'lucide-svelte/icons/x';
	import CheckIcon from 'lucide-svelte/icons/check';

	let inputSlug = $state('');
	let isValidating = $state(false);
	let isValid = $state(false);
</script>

<Sheet.Root>
	<Sheet.Trigger class={buttonVariants({ variant: 'default', size: 'sm' })}
		>Create Repository</Sheet.Trigger
	>
	<Sheet.Content side="right">
		<Sheet.Header>
			<Sheet.Title>Create Repository</Sheet.Title>
			<Sheet.Description>Create a new repository for your team</Sheet.Description>
		</Sheet.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 grid-rows-2 items-center gap-4">
				<Label for="name" class="row-start-1 text-right">Repo Slug</Label>
				<Input id="name" bind:value={inputSlug} class="col-span-3 row-start-2" />
				<span class="col-start-4 row-start-2"></span>
			</div>
		</div>
		<Sheet.Footer>
			<Sheet.Close disabled={!isValid} class={buttonVariants({ variant: 'outline' })}
				>Save changes</Sheet.Close
			>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
