<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

hello {data.user.username}
