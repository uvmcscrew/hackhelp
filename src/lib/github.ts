import { App, Octokit } from 'octokit';
import { serverEnv } from './env/server';

const github__ = new App({
	appId: serverEnv.GITHUB_APP_ID,
	privateKey: serverEnv.GITHUB_APP_PRIVATE_KEY
});

const [
	{
		installation: { id: appInstallId }
	}
] = (await Array.fromAsync(github__.eachInstallation.iterator())).filter(
	(i) => i.installation.account?.login === serverEnv.PUBLIC_GITHUB_ORGNAME
);

export const githubApp = await github__.getInstallationOctokit(appInstallId);

export const octokit = new Octokit({
	request: {
		fetch
	}
});
