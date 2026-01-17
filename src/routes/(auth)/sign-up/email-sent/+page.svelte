<script lang="ts">
	import { CardContent } from '$lib/components/ui/card';
	import { clientEnv } from '$lib/env/client';

	import BadgeCheck from 'lucide-svelte/icons/badge-check';
</script>

<CardContent class="flex flex-col gap-y-3">
	<BadgeCheck class="h-16 w-auto" />
	<h2 class="text-center text-xl font-semibold">Email Sent!</h2>
	<p class=" text-muted-foreground text-center text-sm">
		Check your email for a message from {clientEnv.PUBLIC_SMTP_FROM}
	</p>
</CardContent>
