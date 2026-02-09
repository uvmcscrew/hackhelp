<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		children?: Snippet;
		title?: string;
		class?: string;
	};

	let { children, title, class: cssClass }: Props = $props();
</script>

<div
	class={twMerge(
		'rounded-md bg-red-50 p-4 dark:bg-red-500/15 dark:outline dark:outline-red-500/25',
		cssClass
	)}
>
	<div class="flex">
		<div class="shrink-0">
			<svg
				viewBox="0 0 20 20"
				fill="currentColor"
				data-slot="icon"
				aria-hidden="true"
				class="size-5 text-red-400"
			>
				<path
					d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
					clip-rule="evenodd"
					fill-rule="evenodd"
				/>
			</svg>
		</div>
		<div class="ml-3">
			{#if title}
				<h3 class="text-sm font-medium text-red-800 dark:text-red-200">{title}</h3>
			{/if}
			{#if children}
				<div class="mt-2 text-sm text-red-700 dark:text-red-200/80">
					{@render children()}
				</div>
			{/if}
		</div>
	</div>
</div>
