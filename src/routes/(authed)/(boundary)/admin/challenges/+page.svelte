<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Plus from 'lucide-svelte/icons/plus';
	import { Badge } from '$lib/components/ui/badge';

	const qc = useQueryClient();

	const challengesQuery = createQuery(() => orpc.admin.challenges.list.queryOptions());
	const reposQuery = createQuery(() => orpc.admin.challenges.githubOrgRepos.queryOptions());

	const invalidate = () =>
		qc.invalidateQueries({ queryKey: orpc.admin.challenges.list.queryKey() });

	// ── Create challenge ──
	let showCreate = $state(false);
	let createTitle = $state('');
	let createDescription = $state('');
	let createLinkedRepo = $state('');

	const createMut = createMutation(() =>
		orpc.admin.challenges.create.mutationOptions({
			onSuccess: () => {
				showCreate = false;
				createTitle = '';
				createDescription = '';
				createLinkedRepo = '';
				invalidate();
			}
		})
	);

	function handleCreate() {
		if (!createTitle.trim()) return;
		createMut.mutate({
			title: createTitle.trim(),
			description: createDescription.trim() || undefined,
			linkedRepo: createLinkedRepo || undefined
		});
	}

	// ── Edit challenge ──
	let editId = $state<string | null>(null);
	let editTitle = $state('');
	let editDescription = $state('');
	let editLinkedRepo = $state<string | null>(null);

	const updateMut = createMutation(() =>
		orpc.admin.challenges.update.mutationOptions({
			onSuccess: () => {
				editId = null;
				invalidate();
			}
		})
	);

	function startEdit(ch: {
		id: string;
		title: string;
		description: string | null;
		linkedRepo: string | null;
	}) {
		editId = ch.id;
		editTitle = ch.title;
		editDescription = ch.description ?? '';
		editLinkedRepo = ch.linkedRepo;
	}

	function saveEdit() {
		if (!editId || !editTitle.trim()) return;
		updateMut.mutate({
			id: editId,
			title: editTitle.trim(),
			description: editDescription.trim(),
			linkedRepo: editLinkedRepo
		});
	}

	// ── Delete challenge ──
	const deleteMut = createMutation(() =>
		orpc.admin.challenges.delete.mutationOptions({ onSuccess: invalidate })
	);

	function handleDelete(id: string, title: string) {
		if (
			confirm(`Delete challenge "${title}"? Teams with this challenge selected will be unlinked.`)
		) {
			deleteMut.mutate({ id });
		}
	}
</script>

<svelte:head>
	<title>Manage Challenges</title>
</svelte:head>

<div class="container mx-auto max-w-3xl py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Challenges</h1>
		<Button onclick={() => (showCreate = !showCreate)}>
			<Plus class="mr-2 h-4 w-4" />
			Create Challenge
		</Button>
	</div>

	<!-- Create form -->
	{#if showCreate}
		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title class="text-base">New Challenge</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col gap-4">
				<div class="space-y-2">
					<Label>Title</Label>
					<Input bind:value={createTitle} placeholder="Challenge title" maxlength={200} />
				</div>
				<div class="space-y-2">
					<Label>Description</Label>
					<textarea
						bind:value={createDescription}
						placeholder="Challenge description (optional)"
						class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						maxlength={5000}
					></textarea>
				</div>
				<div class="space-y-2">
					<Label>Linked Repository</Label>
					<Select.Root
						type="single"
						value={createLinkedRepo}
						onValueChange={(v) => {
							if (v !== undefined) createLinkedRepo = v;
						}}
					>
						<Select.Trigger class="w-full">
							{createLinkedRepo || 'Select a repository...'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">None</Select.Item>
							{#each reposQuery.data ?? [] as repo (repo.fullName)}
								<Select.Item value={repo.fullName}>{repo.fullName}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex gap-2">
					<Button onclick={handleCreate} disabled={!createTitle.trim() || createMut.isPending}>
						{createMut.isPending ? 'Creating...' : 'Create'}
					</Button>
					<Button variant="ghost" onclick={() => (showCreate = false)}>Cancel</Button>
				</div>
				{#if createMut.isError}
					<p class="text-destructive text-sm">{createMut.error.message}</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Challenges list -->
	{#if challengesQuery.isLoading}
		<p class="text-muted-foreground">Loading challenges...</p>
	{:else if challengesQuery.isError}
		<p class="text-destructive">Failed to load challenges.</p>
	{:else if challengesQuery.data}
		{#if challengesQuery.data.length === 0}
			<Card.Root>
				<Card.Content class="py-8 text-center">
					<p class="text-muted-foreground">No challenges yet. Create one to get started.</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="flex flex-col gap-4">
				{#each challengesQuery.data as challenge (challenge.id)}
					<Card.Root>
						{#if editId === challenge.id}
							<!-- Edit mode -->
							<Card.Content class="flex flex-col gap-4 pt-6">
								<div class="space-y-2">
									<Label>Title</Label>
									<Input
										bind:value={editTitle}
										maxlength={200}
										onkeydown={(e) => {
											if (e.key === 'Enter') saveEdit();
											if (e.key === 'Escape') editId = null;
										}}
									/>
								</div>
								<div class="space-y-2">
									<Label>Description</Label>
									<textarea
										bind:value={editDescription}
										class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
										maxlength={5000}
									></textarea>
								</div>
								<div class="space-y-2">
									<Label>Linked Repository</Label>
									<Select.Root
										type="single"
										value={editLinkedRepo ?? ''}
										onValueChange={(v) => {
											if (v !== undefined) editLinkedRepo = v || null;
										}}
									>
										<Select.Trigger class="w-full">
											{editLinkedRepo || 'Select a repository...'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="">None</Select.Item>
											{#each reposQuery.data ?? [] as repo (repo.fullName)}
												<Select.Item value={repo.fullName}>{repo.fullName}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
								<div class="flex gap-2">
									<Button onclick={saveEdit} disabled={!editTitle.trim() || updateMut.isPending}>
										{updateMut.isPending ? 'Saving...' : 'Save'}
									</Button>
									<Button variant="ghost" onclick={() => (editId = null)}>Cancel</Button>
								</div>
								{#if updateMut.isError}
									<p class="text-destructive text-sm">{updateMut.error.message}</p>
								{/if}
							</Card.Content>
						{:else}
							<!-- View mode -->
							<Card.Header>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<Card.Title class="text-lg">{challenge.title}</Card.Title>
										<Badge variant="outline">{challenge.teamCount} teams</Badge>
									</div>
									<div class="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											class="h-8 w-8"
											onclick={() => startEdit(challenge)}
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="text-destructive h-8 w-8"
											onclick={() => handleDelete(challenge.id, challenge.title)}
											disabled={deleteMut.isPending}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</div>
								{#if challenge.linkedRepo}
									<Card.Description>
										Repo: <a
											href="https://github.com/{challenge.linkedRepo}"
											target="_blank"
											rel="noopener noreferrer"
											class="text-primary underline">{challenge.linkedRepo}</a
										>
									</Card.Description>
								{/if}
							</Card.Header>
							{#if challenge.description}
								<Card.Content>
									<p class="text-muted-foreground text-sm whitespace-pre-wrap">
										{challenge.description}
									</p>
								</Card.Content>
							{/if}
						{/if}
					</Card.Root>
				{/each}
			</div>
		{/if}

		{#if deleteMut.isError}
			<p class="text-destructive mt-4 text-sm">{deleteMut.error.message}</p>
		{/if}
	{/if}
</div>
