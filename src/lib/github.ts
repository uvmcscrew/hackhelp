import { App, Octokit } from 'octokit';
import { serverEnv } from './env/server';
import { building } from '$app/environment';

const github__ = new App({
	appId: serverEnv.GITHUB_APP_ID,
	privateKey: serverEnv.GITHUB_APP_PRIVATE_KEY
});

export let githubApp: GithubAppClient;

export type GithubAppClient = Awaited<ReturnType<typeof github__.getInstallationOctokit>>;

void (async () => {
	console.log('Github App ID: ', serverEnv.GITHUB_APP_ID);
	console.log('Github Org Name: ', serverEnv.PUBLIC_GITHUB_ORGNAME);

	if (building) {
		console.log('Skipping Github App Client initialization during build');
		return;
	}

	const [
		{
			installation: { id: appInstallId }
		}
	] = (await Array.fromAsync(github__.eachInstallation.iterator())).filter(
		(i) => i.installation.account?.login === serverEnv.PUBLIC_GITHUB_ORGNAME
	);

	console.log('Github App Install ID: ', appInstallId);

	githubApp = await github__.getInstallationOctokit(appInstallId);
})();

export const octokit = new Octokit({
	request: {
		fetch
	}
});
