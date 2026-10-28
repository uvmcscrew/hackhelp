import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-bun';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit({
		adapter: adapter(),
		tracing: {
			server: true
		}
	})]
});
