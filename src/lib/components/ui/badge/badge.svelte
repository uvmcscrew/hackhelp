<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';
	export const badgeVariants = tv({
		base: 'focus:ring-ring inline-flex select-none items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground  border-transparent shadow',
				secondary: 'bg-secondary text-secondary-foreground  border-transparent',
				destructive: 'bg-destructive text-destructive-foreground  border-transparent shadow',
				outline: 'text-foreground'
			},
			hoverEffects: {
				true: 'hover:cursor-pointer',
				false: ''
			}
		},
		defaultVariants: {
			variant: 'default',
			hoverEffects: true
		},
		compoundVariants: [
			{
				variant: 'default',
				hoverEffects: true,
				styles: 'hover:bg-primary/80'
			},
			{
				variant: 'secondary',
				hoverEffects: true,
				styles: 'hover:bg-secondary/80'
			},
			{
				variant: 'destructive',
				hoverEffects: true,
				styles: 'hover:bg-destructive/80'
			}
		]
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = 'default',
		hoverEffects,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
		hoverEffects?: VariantProps<typeof badgeVariants>['hoverEffects'];
	} = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	bind:this={ref}
	{href}
	class={cn(badgeVariants({ variant, hoverEffects }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
