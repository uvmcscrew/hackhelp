<script lang="ts">
	import { sessionQueryOptions } from '$lib/auth/client.svelte';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { Badge } from './ui/badge';
	import { twMerge } from 'tailwind-merge';
	import { capitalize } from 'es-toolkit/string';

	type Props = {
		adminAsOrganizer?: boolean;
		class?: string;
	};

	const { adminAsOrganizer = false, class: extraClasses }: Props = $props();

	const sessionQuery = createQuery(() => sessionQueryOptions);
	const profileQuery = createQuery(() => orpc.account.profile.get.queryOptions());

	const ready = $derived(sessionQuery.status === 'success' && profileQuery.status === 'success');

	const roles = $derived((sessionQuery.data?.user.role ?? '').split(','));

	const displayRole = $derived.by(() => {
		if (profileQuery.data && profileQuery.data.profile.primaryRole) {
			return profileQuery.data.profile.primaryRole;
		}

		if (roles.includes('admin')) {
			return 'admin';
		}

		if (roles.includes('mentor')) {
			return 'mentor';
		}

		if (roles.includes('judge')) {
			return 'judge';
		}

		return 'competitor';
	});

	const label = $derived(capitalize(displayRole));
</script>

{#if ready}
	{#if displayRole === 'admin'}
		{@const adminLabel = adminAsOrganizer ? 'Organizer' : 'Administrator'}
		<Badge
			class={twMerge('ml-2 rounded-full bg-purple-400 px-2 py-1', extraClasses)}
			hoverEffects={false}>{adminLabel}</Badge
		>
	{:else if displayRole === 'judge'}
		<Badge
			class={twMerge('ml-2 rounded-full bg-blue-400 px-2 py-1', extraClasses)}
			hoverEffects={false}>{label}</Badge
		>
	{:else if displayRole === 'mentor'}
		<Badge
			class={twMerge('ml-2 rounded-full bg-green-400 px-2 py-1', extraClasses)}
			hoverEffects={false}>{label}</Badge
		>
	{:else if displayRole === 'competitor'}
		<Badge
			class={twMerge('ml-2 rounded-full bg-yellow-400 px-2 py-1', extraClasses)}
			hoverEffects={false}>{label}</Badge
		>
	{/if}
{/if}
