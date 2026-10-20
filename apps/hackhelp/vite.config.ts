import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import adapter from 'svelte-adapter-bun';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit({
		adapter: adapter(),
	})]
});
