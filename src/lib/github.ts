import { App, Octokit } from 'octokit';
import { serverEnv } from './env/server';

export const githubApi = new App({
	appId: serverEnv.GITHUB_APP_ID,
	privateKey: serverEnv.GITHUB_APP_PRIVATE_KEY
});

export async function getGithubAppInstallationClient() {
	const [
		{
			installation: { id: appInstallId }
		}
	] = (await Array.fromAsync(githubApi.eachInstallation.iterator())).filter(
		(i) => i.installation.account?.login === serverEnv.PUBLIC_GITHUB_ORGNAME
	);

	return await githubApi.getInstallationOctokit(appInstallId);
}

export const octokit = new Octokit({
	request: {
		fetch
	}
});
