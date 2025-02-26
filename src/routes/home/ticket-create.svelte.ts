import { writable } from 'svelte/store';

// eslint-disable-next-line prefer-const
export let issueId = writable<string | null>(null);

// eslint-disable-next-line prefer-const
export let ticketCreateSheetOpen = writable(false);
