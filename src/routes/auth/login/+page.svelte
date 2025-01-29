<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { CardDescription } from '$lib/components/ui/card';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import { type GET as GetGithubAuthUrl } from './github/+server';
</script>

<CardHeader
	><CardTitle>HackHelp Sign In</CardTitle><CardDescription>Sign in with GitHub</CardDescription
	></CardHeader
>
<CardContent><Button href="/auth/login/github">Sign In with Github</Button></CardContent>
