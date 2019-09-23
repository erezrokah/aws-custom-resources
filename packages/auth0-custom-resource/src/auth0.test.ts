import axios from 'axios';
import {
  getBearerToken,
  createClient,
  updateClient,
  deleteClient,
} from './auth0';

jest.mock('axios', () => {
  return {
    default: {
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    },
  };
});

describe('circleci', () => {
  const post = axios.post as jest.Mock;
  const patch = axios.patch as jest.Mock;
  const del = axios.delete as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should send correct post request on getBearerToken', async () => {
    post.mockReturnValue(
      Promise.resolve({ data: { access_token: 'access_token' } }),
    );

    const result = await getBearerToken('domain', 'clientId', 'clientSecret');

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('https://domain/oauth/token', {
      grant_type: 'client_credentials',
      client_id: 'clientId',
      client_secret: 'clientSecret',
      audience: `https://domain/api/v2/`,
    });
    expect(result).toEqual('access_token');
  });

  test('should send correct post request on createClient', async () => {
    const expected = {
      data: { client_id: 'clientId', client_secret: 'clientSecret' },
    };
    post.mockReturnValue(Promise.resolve(expected));

    const actual = await createClient('domain', { name: 'name' }, 'token');

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      `https://domain/api/v2/clients`,
      { name: 'name' },
      {
        headers: { Authorization: 'Bearer token' },
      },
    );
    expect(actual).toEqual(expected.data);
  });

  test('should send correct patch request on updateClient', async () => {
    const expected = {
      data: { client_id: 'clientId', client_secret: 'clientSecret' },
    };
    patch.mockReturnValue(Promise.resolve(expected));

    await updateClient('domain', 'clientId', { name: 'name' }, 'token');

    expect(patch).toHaveBeenCalledTimes(1);
    expect(patch).toHaveBeenCalledWith(
      `https://domain/api/v2/clients/clientId`,
      { name: 'name' },
      {
        headers: { Authorization: 'Bearer token' },
      },
    );
  });

  test('should send correct delete request on deleteClient', async () => {
    const expected = {
      data: {},
    };
    del.mockReturnValue(Promise.resolve(expected));

    await deleteClient('domain', 'clientId', 'token');

    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith(`https://domain/api/v2/clients/clientId`, {
      headers: { Authorization: 'Bearer token' },
    });
  });
});
