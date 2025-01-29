<script lang="ts">
	import '../app.css';

	let { children } = $props();

	$effect(() => {
		const mqColorScheme = window.matchMedia('(prefers-color-scheme: dark)');

		console.log(
			'Registering Color Scheme Listener.',
			'Current color scheme:',
			mqColorScheme.matches ? 'dark' : 'light'
		);
		document.documentElement.classList.toggle('dark', mqColorScheme.matches);

		mqColorScheme.addEventListener('change', (e) => {
			console.log('Color scheme changed to:', e.matches ? 'dark' : 'light');
			document.documentElement.classList.toggle('dark', e.matches);
		});

		return () => {
			console.log('Unregistering Color Scheme Listener.');
			mqColorScheme.removeEventListener('change', (e) => {
				document.documentElement.classList.toggle('dark', e.matches);
			});
		};
	});
</script>

{@render children()}
