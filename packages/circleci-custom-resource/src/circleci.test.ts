import axios from 'axios';
import { follow, setEnvs, updateProjectSettings, unfollow } from './circleci';

jest.spyOn(console, 'log').mockImplementation(() => undefined);
jest.spyOn(console, 'error').mockImplementation(() => undefined);

jest.mock('axios', () => {
  return {
    default: {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    },
  };
});

describe('circleci', () => {
  const post = axios.post as jest.Mock;
  const put = axios.put as jest.Mock;
  const get = axios.get as jest.Mock;
  const del = axios.delete as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should send correct post request on follow', async () => {
    const result = Promise.resolve({ data: { following: true } });
    post.mockReturnValue(result);

    await follow('token', 'owner', 'repo');

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      'https://circleci.com/api/v1.1/project/github/owner/repo/follow?circle-token=token',
    );

    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      'Following repo repo under owner owner',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Successfully followed repo repo under owner owner',
    );
  });

  test('should log and throw error on follow failure', async () => {
    const result = Promise.resolve({ data: { following: false } });
    post.mockReturnValue(result);

    const message = 'Failed to follow repo repo under owner owner';
    const error = new Error(message);
    await expect(follow('token', 'owner', 'repo')).rejects.toEqual(error);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      'https://circleci.com/api/v1.1/project/github/owner/repo/follow?circle-token=token',
    );

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      'Following repo repo under owner owner',
    );
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(message);
  });

  test('should send correct post request on unfollow', async () => {
    const result = Promise.resolve({ data: { following: false } });
    post.mockReturnValue(result);

    await unfollow('token', 'owner', 'repo');

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      'https://circleci.com/api/v1.1/project/github/owner/repo/unfollow?circle-token=token',
    );

    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      'Unfollowing repo repo under owner owner',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Successfully unfollowed repo repo under owner owner',
    );
  });

  test('should log and throw error on unfollow failure', async () => {
    const result = Promise.resolve({ data: { following: true } });
    post.mockReturnValue(result);

    const message = 'Failed to unfollow repo repo under owner owner';
    const error = new Error(message);
    await expect(unfollow('token', 'owner', 'repo')).rejects.toEqual(error);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      'https://circleci.com/api/v1.1/project/github/owner/repo/unfollow?circle-token=token',
    );

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      'Unfollowing repo repo under owner owner',
    );
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(message);
  });

  test('should send correct put request on updateProjectSettings', async () => {
    put.mockReturnValue(Promise.resolve());

    await updateProjectSettings('token', 'owner', 'repo');

    expect(put).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledWith(
      'https://circleci.com/api/v1.1/project/github/owner/repo/settings?circle-token=token',
      {
        feature_flags: {
          'build-prs-only': true,
          'build-fork-prs': false,
          'forks-receive-secret-env-vars': false,
        },
      },
    );

    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      'Updating settings for project repo',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Done updating settings for project repo',
    );
  });

  test('should delete existing envs and set new ones on setEnvs', async () => {
    const existing = [{ name: 'existingName', value: 'existingValue' }];
    get.mockReturnValue(Promise.resolve({ data: existing }));

    del.mockReturnValue(Promise.resolve());

    post.mockReturnValue(Promise.resolve());

    const newEnvs = [{ name: 'newName', value: 'newValue' }];
    await setEnvs('token', 'owner', 'repo', newEnvs);

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(
      'https://circleci.com/api/v1.1/project/github/owner/repo/envvar?circle-token=token',
    );

    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith(
      'https://circleci.com/api/v1.1/project/github/owner/repo/envvar/existingName?circle-token=token',
    );

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      'https://circleci.com/api/v1.1/project/github/owner/repo/envvar?circle-token=token',
      { name: 'newName', value: 'newValue' },
    );

    expect(console.log).toHaveBeenCalledTimes(4);
    expect(console.log).toHaveBeenCalledWith(
      'Deleting existing environment vars for project repo',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Done deleting existing environment vars for project repo',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Setting environment vars for project repo',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Successfully set environment vars for project repo',
    );
  });
});
