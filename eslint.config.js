// @ts-check
import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.strictTypeChecked,
	// ...ts.configs.stylisticTypeChecked,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },

		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			// 'no-unused-vars': ['error', { varsIgnorePattern: '[iI]gnored' }],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true
				}
			],
			'@typescript-eslint/no-unnecessary-condition': ['warn', {}],
			'@typescript-eslint/no-confusing-void-expression': [
				'error',
				{
					ignoreArrowShorthand: true
				}
			],
			'@typescript-eslint/restrict-template-expressions': [
				'warn',
				{
					allowNumber: true,
					allowBoolean: true,
					allowAny: true
				}
			]
		}
	},
	{
		files: ['**/*.ts'],

		languageOptions: {
			parserOptions: {
				projectService: true,
				parser: ts.parser
			}
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],

		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		},

		rules: {
			// why the following exceptions: ts-eslint seems to not understand the types in svelte files
			'@typescript-eslint/unbound-method': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-confusing-void-expression': 'off',
			'svelte/no-unused-class-name': 'off',
			'svelte/block-lang': [
				'error',
				{
					enforceScriptPresent: false,
					script: ['ts'] // a list of languages or null to signify no language specified
				}
			],
			'svelte/no-top-level-browser-globals': 'warn',
			'svelte/no-navigation-without-resolve': [
				'error',
				{
					ignoreLinks: true
				}
			]
		}
	},
	{
		files: [
			'**/*.js'
			// '**/*.d.ts'
		],
		extends: [ts.configs.disableTypeChecked]
	}
);
