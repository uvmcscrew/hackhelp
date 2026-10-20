import type { Command } from '../types';
import { ping } from './ping';

/**
 * Every command the bot knows about. Add new command modules here; they are
 * deployed to Discord by `deploy-commands.ts` and routed by the
 * `interactionCreate` event.
 */
export const commands: Command[] = [ping];
