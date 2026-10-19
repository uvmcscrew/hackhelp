<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="grid h-[calc(100vh-4rem)] w-full place-content-center">
	<h1 class="text-4xl font-bold">{page.status}</h1>
	<p>{page.error?.message}</p>
</div>
