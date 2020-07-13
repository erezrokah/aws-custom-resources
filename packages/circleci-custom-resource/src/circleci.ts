import axios from 'axios';

const api = 'https://circleci.com/api/v1.1/project/github';

export const follow = async (
  token: string,
  owner: string,
  repo: string,
): Promise<void> => {
  console.log(`Following repo ${repo} under owner ${owner}`);
  const result = await axios.post(
    `${api}/${owner}/${repo}/follow?circle-token=${token}`,
  );
  const { following } = result.data;
  if (following) {
    console.log(`Successfully followed repo ${repo} under owner ${owner}`);
  } else {
    const message = `Failed to follow repo ${repo} under owner ${owner}`;
    console.error(message);
    throw new Error(message);
  }
};

export const setEnvs = async (
  token: string,
  owner: string,
  repo: string,
  envs: Array<{ name: string; value: string }>,
): Promise<void> => {
  console.log(`Deleting existing environment vars for project ${repo}`);
  const { data: existing } = await axios.get(
    `${api}/${owner}/${repo}/envvar?circle-token=${token}`,
  );

  await Promise.all(
    existing.map(({ name }: { name: string }) =>
      axios.delete(
        `${api}/${owner}/${repo}/envvar/${name}?circle-token=${token}`,
      ),
    ),
  );
  console.log(`Done deleting existing environment vars for project ${repo}`);

  console.log(`Setting environment vars for project ${repo}`);
  await Promise.all(
    envs.map(({ name, value }) =>
      axios.post(`${api}/${owner}/${repo}/envvar?circle-token=${token}`, {
        name,
        value,
      }),
    ),
  );
  console.log(`Successfully set environment vars for project ${repo}`);
};

export const updateProjectSettings = async (
  token: string,
  owner: string,
  repo: string,
): Promise<void> => {
  console.log(`Updating settings for project ${repo}`);
  await axios.put(`${api}/${owner}/${repo}/settings?circle-token=${token}`, {
    feature_flags: {
      'build-prs-only': true,
      'build-fork-prs': false,
      'forks-receive-secret-env-vars': false,
    },
  });
  console.log(`Done updating settings for project ${repo}`);
};

export const unfollow = async (
  token: string,
  owner: string,
  repo: string,
): Promise<void> => {
  console.log(`Unfollowing repo ${repo} under owner ${owner}`);
  const result = await axios.post(
    `${api}/${owner}/${repo}/unfollow?circle-token=${token}`,
  );
  const { following } = result.data;
  if (!following) {
    console.log(`Successfully unfollowed repo ${repo} under owner ${owner}`);
  } else {
    const message = `Failed to unfollow repo ${repo} under owner ${owner}`;
    console.error(message);
    throw new Error(message);
  }
};
