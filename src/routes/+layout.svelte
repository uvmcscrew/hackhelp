<script lang="ts">
	import '../app.css';
	let { children } = $props();

	$effect(() => {
		const mqColorScheme = window.matchMedia('(prefers-color-scheme: dark)');

		mqColorScheme.addEventListener('change', (e) => {
			document.documentElement.classList.toggle('dark', e.matches);
		});

		return () => {
			mqColorScheme.removeEventListener('change', (e) => {
				document.documentElement.classList.toggle('dark', e.matches);
			});
		};
	});
</script>

{@render children()}
