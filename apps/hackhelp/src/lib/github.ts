import { App, Octokit } from 'octokit';
import { GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY } from '$app/env/private';
import { PUBLIC_GITHUB_ORGNAME } from '$app/env/public';
import { octokitTracingPlugin } from '#lib/server/github-tracing';

const TracedOctokit = Octokit.plugin(octokitTracingPlugin);

const githubApi = new App({
	appId: Number(GITHUB_APP_ID),
	privateKey: GITHUB_APP_PRIVATE_KEY,
	Octokit: TracedOctokit
});

export async function getGithubAppInstallationClient() {
	const [
		{
			installation: { id: appInstallId }
		}
	] = (await Array.fromAsync(githubApi.eachInstallation.iterator())).filter(
		(i) => i.installation.account?.login === PUBLIC_GITHUB_ORGNAME
	);

	return await githubApi.getInstallationOctokit(appInstallId);
}

export type GithubAppClient = Awaited<ReturnType<typeof getGithubAppInstallationClient>>;

export const octokit = new Octokit({
	request: {
		fetch
	}
});
