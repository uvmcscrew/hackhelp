<script lang="ts">
	import HeartIcon from 'lucide-svelte/icons/heart';
	import SvelteLogo from './SvelteLogo.svelte';
	import { dev } from '$app/environment';
</script>

{#snippet devModeIndicator()}
	{#if dev}
		<span class="px-1 font-semibold text-yellow-400">(dev mode)</span>
	{/if}
{/snippet}

<span
	class="text-muted-foreground inline-flex items-center justify-center text-center font-mono text-sm"
	>HackHelp {@render devModeIndicator()} made with <HeartIcon
		class="h-6 w-6 fill-red-600 stroke-3 p-1 text-red-600"
	/> &
	<SvelteLogo class="h-[1.7rem] w-[1.7rem] p-1" />
	by
	<a href="https://henrikvt.com" target="_blank" class="hover:text-accent-foreground px-1 underline"
		>Henrik VT</a
	>
	|
	<a
		href="https://github.com/uvm-cscrew/hackhelp"
		target="_blank"
		class="hover:text-accent-foreground px-1 underline">Source Code</a
	></span
>
