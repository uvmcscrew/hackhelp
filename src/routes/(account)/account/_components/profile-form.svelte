<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CardContent, CardFooter } from '$lib/components/ui/card';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import XIcon from 'lucide-svelte/icons/x';
	import * as Field from '$lib/components/ui/field';
	import { dietaryRestrictions, shirtSizes } from '$lib/schemas';
	import ChevronsUpDownIcon from 'lucide-svelte/icons/chevrons-up-down';
	import { pickBy } from 'es-toolkit/object';
	import type { RouterOutputs } from '$lib/orpc/server';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Select from '$lib/components/ui/select';

	import { tick } from 'svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';

	type Props = {
		initialProfile: NonNullable<RouterOutputs['account']['profile']['get']>;
	};

	const { initialProfile }: Props = $props();

	const qc = useQueryClient();

	const updateProfileMutation = createMutation(() =>
		orpc.account.profile.update.mutationOptions({
			onSuccess: async () => {
				await qc.invalidateQueries({ queryKey: orpc.account.profile.get.queryKey() });
			}
		})
	);

	async function saveProfile() {
		addDietaryRestrictionComboboxOpen = false;

		await updateProfileMutation.mutateAsync({
			data: { shirtSize, mainlineDietaryRestrictions: dietaryRestrictionsState, otherAllergies }
		});
	}

	let disableField = $derived({
		disabled: updateProfileMutation.isPending,
		'aria-disabled': updateProfileMutation.isPending
	});

	// svelte-ignore state_referenced_locally
	let shirtSize = $state(initialProfile.profile.data.shirtSize);

	// svelte-ignore state_referenced_locally
	let dietaryRestrictionsState = $state(initialProfile.profile.data.mainlineDietaryRestrictions);
	let selectedDRs = $derived(pickBy(dietaryRestrictionsState, (v) => v));
	// svelte-ignore state_referenced_locally
	let otherAllergies = $state(initialProfile.profile.data.otherAllergies);

	// Combobox state
	let addDietaryRestrictionComboboxOpen = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, svelte/no-top-level-browser-globals
	let triggerRef = $state<HTMLButtonElement>(null!);
	let unselectedDRs = $derived(pickBy(dietaryRestrictionsState, (v) => !v));
	function closeAndFocusTrigger() {
		addDietaryRestrictionComboboxOpen = false;
		void tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<CardContent>
	<Field.Group>
		<Field.Set>
			<Field.Field>
				<Field.Label>Shirt Size</Field.Label>
				<Select.Root type="single" bind:value={shirtSize}>
					<Select.Trigger {...disableField} id="shirtSize">
						{shirtSize ? shirtSizes[shirtSize as keyof typeof shirtSizes] : 'Select size'}
					</Select.Trigger>
					<Select.Content>
						{#each Object.keys(shirtSizes) as size (size)}
							<Select.Item value={size} label={shirtSizes[size as keyof typeof shirtSizes]} />
						{/each}
					</Select.Content>
				</Select.Root>
			</Field.Field>
		</Field.Set>
		<Field.Set>
			<Field.Legend>Dietary Restrictions & Allergies</Field.Legend>
			<Field.Description>Please select this information accurately</Field.Description>
			<Field.Set>
				<div class="flex flex-wrap gap-x-2 gap-y-2">
					{#each Object.keys(selectedDRs) as drKey (drKey)}
						<Badge
							onclick={() => {
								dietaryRestrictionsState[drKey as keyof typeof dietaryRestrictions] = false;
							}}
							variant="secondary"
							class="group inline-flex items-center rounded-full text-sm hover:outline-red-500"
							>{dietaryRestrictions[drKey as keyof typeof dietaryRestrictions]}
							<XIcon class="text-muted-foreground ml-2 size-4 h-auto group-hover:text-red-500" />
						</Badge>
					{:else}
						<i class="text-muted-foreground text-sm h-6.5">No allergies selected</i>
					{/each}
				</div>
				{@render commonAllergiesCombobox()}
			</Field.Set>
			<Field.Field>
				<Field.Label>Other Allergies</Field.Label>
				<Input
					bind:value={otherAllergies}
					{...disableField}
					placeholder="Fill in allergies not available in the dropdown above"
				/>
			</Field.Field>
		</Field.Set>
	</Field.Group>
</CardContent>
<CardFooter
	><Button {...disableField} onclick={saveProfile}
		>{#if updateProfileMutation.isPending}
			<LoaderCircle class="h-6 w-auto animate-spin" />
		{/if}Save</Button
	></CardFooter
>

{#snippet commonAllergiesCombobox()}
	<Popover.Root bind:open={addDietaryRestrictionComboboxOpen}>
		<Popover.Trigger bind:ref={triggerRef}>
			{#snippet child({ props })}
				<Button
					{...props}
					{...disableField}
					variant="outline"
					class="w-50 justify-between"
					role="combobox"
					aria-expanded={addDietaryRestrictionComboboxOpen}
				>
					Add restriction
					<ChevronsUpDownIcon class="opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content {...disableField} class="w-50 p-0">
			<Command.Root {...disableField}>
				<Command.Input placeholder="Search..." />
				<Command.List>
					<Command.Group value="unselectedDietaryRestrictions">
						{#each Object.keys(unselectedDRs) as drKey (drKey)}
							<Command.Item
								value={drKey}
								onSelect={() => {
									dietaryRestrictionsState[drKey as keyof typeof dietaryRestrictions] = true;
									closeAndFocusTrigger();
								}}
							>
								{dietaryRestrictions[drKey as keyof typeof dietaryRestrictions]}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
{/snippet}
