<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import Button from './ui/button/button.svelte';
	import SunIcon from 'lucide-svelte/icons/sun';
	import MoonIcon from 'lucide-svelte/icons/moon';
</script>

{#if mode.current}
	<Button onclick={toggleMode} variant="ghost" size="icon">
		{#if mode.current === 'dark'}
			<SunIcon class="h-8 w-8" />
		{:else}
			<MoonIcon class="h-8 w-8" />
		{/if}
	</Button>
{/if}
