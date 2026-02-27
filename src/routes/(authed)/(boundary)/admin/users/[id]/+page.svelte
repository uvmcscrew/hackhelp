<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import Github from 'lucide-svelte/icons/github';
	import Mail from 'lucide-svelte/icons/mail';
	import Shield from 'lucide-svelte/icons/shield';
	import Users from 'lucide-svelte/icons/users';
	import Link from 'lucide-svelte/icons/link';
	import GraduationCap from 'lucide-svelte/icons/graduation-cap';
	import type { PageProps } from './$types';
	import { deserialize } from 'superjson';
	import { shirtSizes, dietaryRestrictions, type ProfileData } from '$lib/schemas';

	let { data }: PageProps = $props();

	const userQuery = createQuery(() =>
		orpc.admin.users.getById.queryOptions({
			input: { userId: data.userId }
		})
	);

	// Deserialize profile data
	let profileData = $derived.by(() => {
		const profile = userQuery.data?.profile;
		if (!profile?.data) return null;
		try {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
			return deserialize(profile.data) as ProfileData;
		} catch {
			return null;
		}
	});

	function formatDate(date: Date | string | null | undefined): string {
		if (!date) return '—';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getRoleBadgeVariant(role: string) {
		if (role === 'admin') return 'default' as const;
		if (role === 'mentor') return 'blue' as const;
		if (role === 'judge') return 'yellow' as const;
		if (role === 'verifiedUser') return 'green' as const;
		return 'secondary' as const;
	}
</script>

<svelte:head>
	<title>{userQuery.data?.user.name ?? 'User'} | User Administration</title>
</svelte:head>

<div class="container mx-auto max-w-2xl py-8">
	<Button variant="ghost" href="/admin/users" class="mb-4 px-2">&larr; All Users</Button>

	{#if userQuery.isLoading}
		<p class="text-muted-foreground">Loading user...</p>
	{:else if userQuery.isError}
		<Card.Root>
			<Card.Header>
				<Card.Title>User Not Found</Card.Title>
				<Card.Description>This user doesn't exist or has been removed.</Card.Description>
			</Card.Header>
		</Card.Root>
	{:else if userQuery.data}
		{@const u = userQuery.data.user}
		{@const profile = userQuery.data.profile}
		{@const accounts = userQuery.data.accounts}
		{@const team = userQuery.data.team}

		<!-- Basic Info Card -->
		<Card.Root class="mb-6">
			<Card.Header>
				<div class="flex items-center gap-4">
					<Avatar.Root class="h-14 w-14">
						<Avatar.Image src={u.image} alt={u.name} />
						<Avatar.Fallback>
							<CircleUser class="h-8 w-8" />
						</Avatar.Fallback>
					</Avatar.Root>
					<div class="min-w-0 flex-1">
						<Card.Title class="text-xl">{u.name}</Card.Title>
						<Card.Description class="flex flex-col gap-0.5">
							<span>{u.email}</span>
							{#if u.username}
								<span class="text-xs">@{u.displayUsername ?? u.username}</span>
							{/if}
						</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content class="space-y-3">
				<!-- Auth Roles -->
				<div class="flex flex-wrap items-center gap-2">
					<Shield class="text-muted-foreground h-4 w-4" />
					{#if u.role}
						{#each u.role.split(',').filter((r) => r.trim()) as r (r)}
							<Badge variant={getRoleBadgeVariant(r.trim())} hoverEffects={false}>
								{r.trim()}
							</Badge>
						{/each}
					{:else}
						<span class="text-muted-foreground text-sm">No roles</span>
					{/if}
				</div>

				<!-- Status -->
				<div class="flex flex-wrap items-center gap-2">
					{#if u.banned}
						<Badge variant="destructive" hoverEffects={false}>Banned</Badge>
						{#if u.banReason}
							<span class="text-muted-foreground text-sm">— {u.banReason}</span>
						{/if}
					{:else}
						<Badge variant="green" hoverEffects={false}>Active</Badge>
					{/if}
					{#if u.emailVerified}
						<Badge variant="green" hoverEffects={false}>Email Verified</Badge>
					{:else}
						<Badge variant="secondary" hoverEffects={false}>Email Not Verified</Badge>
					{/if}
				</div>

				<Separator />

				<!-- Metadata -->
				<div class="text-muted-foreground grid grid-cols-2 gap-y-1 text-sm">
					<span>User ID</span>
					<span class="font-mono text-xs">{u.id}</span>
					<span>Created</span>
					<span>{formatDate(u.createdAt)}</span>
					<span>Updated</span>
					<span>{formatDate(u.updatedAt)}</span>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Profile Card -->
		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<CircleUser class="h-4 w-4" />
					Profile
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if profile}
					<div class="space-y-3">
						<div class="text-sm">
							<span class="text-muted-foreground">Primary Role:</span>
							<Badge variant="secondary" hoverEffects={false} class="ml-2">
								{profile.primaryRole ?? 'None'}
							</Badge>
						</div>
						{#if profile.affiliation}
							<div class="text-sm">
								<span class="text-muted-foreground">Affiliation:</span>
								<span class="ml-2">{profile.affiliation}</span>
							</div>
						{/if}

						{#if profileData}
							<Separator />
							{#if profileData.shirtSize}
								<div class="text-sm">
									<span class="text-muted-foreground">Shirt Size:</span>
									<span class="ml-2"
										>{shirtSizes[profileData.shirtSize as keyof typeof shirtSizes]}</span
									>
								</div>
							{/if}
							{@const activeDietary = Object.entries(
								profileData.mainlineDietaryRestrictions
							).filter(([, v]) => v)}
							{#if activeDietary.length > 0}
								<div class="text-sm">
									<span class="text-muted-foreground">Dietary Restrictions:</span>
									<div class="mt-1 flex flex-wrap gap-1">
										{#each activeDietary as [key] (key)}
											<Badge variant="outline" hoverEffects={false}>
												{dietaryRestrictions[key as keyof typeof dietaryRestrictions]}
											</Badge>
										{/each}
									</div>
								</div>
							{/if}
							{#if profileData.otherAllergies}
								<div class="text-sm">
									<span class="text-muted-foreground">Other Allergies:</span>
									<span class="ml-2">{profileData.otherAllergies}</span>
								</div>
							{/if}
						{/if}
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">No profile initialized.</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Linked Accounts Card -->
		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Link class="h-4 w-4" />
					Linked Accounts
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if accounts.length > 0}
					<div class="space-y-4">
						{#each accounts as acct (acct.providerId)}
							{#if acct.providerId === 'github' && 'login' in acct}
								<!-- GitHub -->
								<div class="rounded-md border px-4 py-3">
									<div class="flex items-center gap-3">
										<Avatar.Root class="h-10 w-10">
											<Avatar.Image src={acct.avatarUrl} alt={acct.login} />
											<Avatar.Fallback>
												<!-- eslint-disable-next-line @typescript-eslint/no-deprecated -->
												<Github class="h-5 w-5" />
											</Avatar.Fallback>
										</Avatar.Root>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium">GitHub</span>
												<Badge variant="green" hoverEffects={false}>Linked</Badge>
											</div>
											<div class="text-muted-foreground text-sm">
												<a
													href={acct.profileUrl}
													target="_blank"
													rel="noopener noreferrer"
													class="hover:underline"
												>
													@{acct.login}
												</a>
												{#if acct.name}
													&middot; {acct.name}
												{/if}
											</div>
											{#if acct.bio}
												<p class="text-muted-foreground mt-1 text-xs">{acct.bio}</p>
											{/if}
										</div>
									</div>
								</div>
							{:else if acct.providerId === 'mlh' && 'firstName' in acct}
								<!-- MLH -->
								<div class="rounded-md border px-4 py-3">
									<div class="flex items-center gap-2">
										<span class="text-sm font-medium">MLH</span>
										<Badge variant="green" hoverEffects={false}>Linked</Badge>
									</div>
									<div class="text-muted-foreground mt-2 space-y-1 text-sm">
										<div>{acct.firstName} {acct.lastName}</div>
										<div>{acct.email}</div>
										{#if acct.gender || acct.age}
											<div>
												{#if acct.gender}{acct.gender}{/if}
												{#if acct.gender && acct.age},
												{/if}
												{#if acct.age}Age {acct.age}{/if}
											</div>
										{/if}
										{#if acct.countryOfResidence}
											<div>{acct.countryOfResidence}</div>
										{/if}
										{#if acct.education && acct.education.length > 0}
											<div class="mt-2">
												{#each acct.education as edu (edu)}
													<div class="flex items-center gap-1.5">
														<GraduationCap class="h-3.5 w-3.5 shrink-0" />
														<span>
															{edu.schoolName}
															{#if edu.major}&middot; {edu.major}{/if}
															{#if edu.current}
																<Badge
																	variant="secondary"
																	hoverEffects={false}
																	class="ml-1 text-[10px]">Current</Badge
																>
															{/if}
														</span>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								</div>
							{:else if acct.providerId === 'uvm-netid'}
								<!-- UVM NetID -->
								<div class="flex items-center gap-3 rounded-md border px-4 py-3">
									<Shield class="h-5 w-5 shrink-0" />
									<div>
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium">UVM NetID</span>
											<Badge variant="green" hoverEffects={false}>Linked</Badge>
										</div>
									</div>
								</div>
							{:else if acct.providerId === 'email'}
								<!-- Email -->
								<div class="flex items-center gap-3 rounded-md border px-4 py-3">
									<Mail class="h-5 w-5 shrink-0" />
									<div>
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium">Email / Password</span>
											<Badge variant="green" hoverEffects={false}>Linked</Badge>
										</div>
									</div>
								</div>
							{:else if 'error' in acct}
								<!-- Error fetching profile -->
								<div class="flex items-center gap-3 rounded-md border px-4 py-3">
									<Shield class="h-5 w-5 shrink-0" />
									<div>
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium capitalize">{acct.providerId}</span>
											<Badge variant="secondary" hoverEffects={false}>Linked</Badge>
										</div>
										<p class="text-muted-foreground text-xs">
											Could not fetch profile: {acct.error}
										</p>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">No linked accounts.</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Team Membership Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Users class="h-4 w-4" />
					Team Membership
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if team}
					<div class="flex items-center justify-between rounded-md border px-4 py-3">
						<div>
							<div class="text-sm font-medium">{team.name}</div>
							<div class="text-muted-foreground text-xs">
								Role: {team.role === 'programming' ? 'Programming' : 'Business'}
								{#if team.isCaptain}
									<Badge variant="default" hoverEffects={false} class="ml-1">Captain</Badge>
								{/if}
							</div>
						</div>
						<Button variant="outline" size="sm" href="/admin/teams/{team.id}">View Team</Button>
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">Not on any team.</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
