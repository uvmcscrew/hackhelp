import { App, Octokit } from 'octokit';
import { serverEnv } from './env/server';

export const githubApp = await new App({
	appId: serverEnv.GITHUB_APP_ID,
	privateKey: serverEnv.GITHUB_APP_PRIVATE_KEY
}).getInstallationOctokit(serverEnv.GITHUB_APP_INSTALL_ID);

export const octokit = new Octokit({
	request: {
		fetch: fetch
	}
});
