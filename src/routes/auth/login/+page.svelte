<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { CardDescription } from '$lib/components/ui/card';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import posthog from 'posthog-js';

	// Always reset on the sign in page to ensure we don't track the wrong user
	posthog.reset();
</script>

<CardHeader
	><CardTitle>HackHelp Sign In</CardTitle><CardDescription>Sign in with GitHub</CardDescription
	></CardHeader
>
<CardContent><Button href="/auth/login/github">Sign In with Github</Button></CardContent>
