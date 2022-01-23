import IAM = require('aws-sdk/clients/iam');
import {
  getIamUserName,
  deleteAllKeys,
  createIamUser,
  deleteIamUser,
} from './iam';

jest.mock('aws-sdk/clients/iam', () => {
  const deleteAccessKeyPromise = jest.fn();
  const deleteAccessKey = jest.fn(() => ({ promise: deleteAccessKeyPromise }));

  const listAccessKeysPromise = jest.fn();
  const listAccessKeys = jest.fn(() => ({ promise: listAccessKeysPromise }));

  const createUserPromise = jest.fn();
  const createUser = jest.fn(() => ({ promise: createUserPromise }));

  const deleteUserPromise = jest.fn();
  const deleteUser = jest.fn(() => ({ promise: deleteUserPromise }));

  const attachUserPolicyPromise = jest.fn();
  const attachUserPolicy = jest.fn(() => ({
    promise: attachUserPolicyPromise,
  }));

  const detachUserPolicyPromise = jest.fn();
  const detachUserPolicy = jest.fn(() => ({
    promise: detachUserPolicyPromise,
  }));

  const createAccessKeyPromise = jest.fn();
  const createAccessKey = jest.fn(() => ({
    promise: createAccessKeyPromise,
  }));

  const IAM = {
    listAccessKeys,
    deleteAccessKey,
    createUser,
    deleteUser,
    attachUserPolicy,
    detachUserPolicy,
    createAccessKey,
  };
  return jest.fn(() => IAM);
});

jest.spyOn(console, 'log').mockImplementation(() => undefined);

describe('iam', () => {
  const iam = new IAM();
  const deleteAccessKeyPromise = iam.deleteAccessKey().promise as jest.Mock;
  const listAccessKeysPromise = iam.listAccessKeys().promise as jest.Mock;
  const createUserPromise = iam.createUser().promise as jest.Mock;
  const deleteUserPromise = iam.deleteUser().promise as jest.Mock;
  const attachUserPolicyPromise = iam.attachUserPolicy().promise as jest.Mock;
  const detachUserPolicyPromise = iam.detachUserPolicy().promise as jest.Mock;
  const createAccessKeyPromise = iam.createAccessKey().promise as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return iam user on getIamUserName', () => {
    expect(getIamUserName('owner', 'repo')).toBe('circleci-owner-repo');
  });

  test('should delete all access keys on deleteAllKeys', async () => {
    const username = 'username';
    const data = { UserName: username, AccessKeyId: 'AccessKeyId' };
    listAccessKeysPromise.mockReturnValue(
      Promise.resolve({ AccessKeyMetadata: [data] }),
    );
    deleteAccessKeyPromise.mockReturnValue(Promise.resolve());

    await deleteAllKeys(username);

    expect(iam.listAccessKeys).toHaveBeenCalledTimes(1);
    expect(iam.deleteAccessKey).toHaveBeenCalledTimes(1);

    expect(iam.listAccessKeys).toHaveBeenCalledWith({ UserName: username });
    expect(iam.deleteAccessKey).toHaveBeenCalledWith(data);

    expect(listAccessKeysPromise).toHaveBeenCalledTimes(1);
    expect(deleteAccessKeyPromise).toHaveBeenCalledTimes(1);

    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      'Deleting all access keys for user username',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Done deleting all access keys for user username',
    );
  });

  test('should create new IAM user, attach policy and create access key on createIamUser', async () => {
    const username = 'username';

    createUserPromise.mockReturnValue(Promise.resolve());

    const AccessKey = {
      AccessKeyId: 'AccessKeyId',
      SecretAccessKey: 'SecretAccessKey',
    };
    createAccessKeyPromise.mockReturnValue(Promise.resolve({ AccessKey }));

    attachUserPolicyPromise.mockReturnValue(Promise.resolve());

    const result = await createIamUser(
      username,
      'arn:aws:iam::aws:policy/AdministratorAccess',
    );

    expect(result).toEqual({
      accessKeyId: 'AccessKeyId',
      secretAccessKey: 'SecretAccessKey',
    });

    expect(iam.createUser).toHaveBeenCalledTimes(1);
    expect(iam.attachUserPolicy).toHaveBeenCalledTimes(1);
    expect(iam.createAccessKey).toHaveBeenCalledTimes(1);

    expect(iam.createUser).toHaveBeenCalledWith({ UserName: username });
    expect(iam.attachUserPolicy).toHaveBeenCalledWith({
      PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
      UserName: username,
    });
    expect(iam.createAccessKey).toHaveBeenCalledWith({ UserName: username });

    expect(createUserPromise).toHaveBeenCalledTimes(1);
    expect(attachUserPolicyPromise).toHaveBeenCalledTimes(1);
    expect(createAccessKeyPromise).toHaveBeenCalledTimes(1);
  });

  const setupCreateUser = () => {
    const username = 'username';

    createUserPromise.mockReturnValue(Promise.resolve());

    const AccessKey: IAM.AccessKey = {
      AccessKeyId: 'AccessKeyId',
      SecretAccessKey: 'SecretAccessKey',
      Status: 'Status',
      UserName: username,
      CreateDate: new Date(0),
    };
    createAccessKeyPromise.mockReturnValue(Promise.resolve({ AccessKey }));

    attachUserPolicyPromise.mockReturnValue(Promise.resolve());

    return { username, AccessKey };
  };

  const validateCreateUser = (
    result: { accessKeyId: string; secretAccessKey: string },
    username: string,
    AccessKey: IAM.AccessKey,
  ) => {
    expect(result).toEqual({
      accessKeyId: AccessKey.AccessKeyId,
      secretAccessKey: AccessKey.SecretAccessKey,
    });

    expect(iam.createUser).toHaveBeenCalledTimes(1);
    expect(iam.attachUserPolicy).toHaveBeenCalledTimes(1);
    expect(iam.createAccessKey).toHaveBeenCalledTimes(1);

    expect(iam.createUser).toHaveBeenCalledWith({ UserName: username });
    expect(iam.attachUserPolicy).toHaveBeenCalledWith({
      PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
      UserName: username,
    });
    expect(iam.createAccessKey).toHaveBeenCalledWith({ UserName: username });

    expect(createUserPromise).toHaveBeenCalledTimes(1);
    expect(attachUserPolicyPromise).toHaveBeenCalledTimes(1);
    expect(createAccessKeyPromise).toHaveBeenCalledTimes(1);
  };

  test('should create new IAM user, attach policy and create access key on createIamUser', async () => {
    const { username, AccessKey } = setupCreateUser();

    const result = await createIamUser(
      username,
      'arn:aws:iam::aws:policy/AdministratorAccess',
    );

    validateCreateUser(result, username, AccessKey);
  });

  test('should delete existing key, attach policy and create access key on createIamUser when user exists', async () => {
    const { username, AccessKey } = setupCreateUser();

    const error = { code: 'EntityAlreadyExists' };
    createUserPromise.mockReturnValue(Promise.reject(error));

    const data = { UserName: username, AccessKeyId: 'AccessKeyId' };
    listAccessKeysPromise.mockReturnValue(
      Promise.resolve({ AccessKeyMetadata: [data] }),
    );
    deleteAccessKeyPromise.mockReturnValue(Promise.resolve());

    const result = await createIamUser(
      username,
      'arn:aws:iam::aws:policy/AdministratorAccess',
    );

    validateCreateUser(result, username, AccessKey);

    expect(iam.listAccessKeys).toHaveBeenCalledTimes(1);
    expect(iam.deleteAccessKey).toHaveBeenCalledTimes(1);

    expect(iam.listAccessKeys).toHaveBeenCalledWith({ UserName: username });
    expect(iam.deleteAccessKey).toHaveBeenCalledWith(data);
  });

  test('should throw error on createIamUser for unknown error', async () => {
    const { username } = setupCreateUser();

    const error = { code: 'Unknown' };
    createUserPromise.mockReturnValue(Promise.reject(error));

    await expect(
      createIamUser(username, 'arn:aws:iam::aws:policy/AdministratorAccess'),
    ).rejects.toEqual(error);
  });

  test('should detach policy, delete keys and user on deleteIamUser', async () => {
    const username = 'username';
    detachUserPolicyPromise.mockResolvedValue(Promise.resolve());
    deleteUserPromise.mockReturnValue(Promise.resolve());

    const data = { UserName: username, AccessKeyId: 'AccessKeyId' };
    listAccessKeysPromise.mockReturnValue(
      Promise.resolve({ AccessKeyMetadata: [data] }),
    );
    deleteAccessKeyPromise.mockReturnValue(Promise.resolve());

    await deleteIamUser(
      username,
      'arn:aws:iam::aws:policy/AdministratorAccess',
    );

    expect(iam.detachUserPolicy).toHaveBeenCalledTimes(1);
    expect(iam.deleteUser).toHaveBeenCalledTimes(1);

    expect(iam.detachUserPolicy).toHaveBeenCalledWith({
      PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
      UserName: username,
    });
    expect(iam.deleteUser).toHaveBeenCalledWith({ UserName: username });

    expect(iam.listAccessKeys).toHaveBeenCalledTimes(1);
    expect(iam.deleteAccessKey).toHaveBeenCalledTimes(1);

    expect(iam.listAccessKeys).toHaveBeenCalledWith({ UserName: username });
    expect(iam.deleteAccessKey).toHaveBeenCalledWith(data);
  });

  test('should suppress "NoSuchEntity" error on deleteIamUser', async () => {
    const username = 'username';
    const error = { code: 'NoSuchEntity' };
    detachUserPolicyPromise.mockResolvedValue(Promise.reject(error));

    await deleteIamUser(
      username,
      'arn:aws:iam::aws:policy/AdministratorAccess',
    );

    expect(console.log).toHaveBeenCalledWith(
      "Policy arn:aws:iam::aws:policy/AdministratorAccess doesn't exists",
    );
  });

  test('should throw unknown error on deleteIamUser', async () => {
    const username = 'username';
    const error = { code: 'Unknown' };
    detachUserPolicyPromise.mockResolvedValue(Promise.reject(error));

    await expect(
      deleteIamUser(username, 'arn:aws:iam::aws:policy/AdministratorAccess'),
    ).rejects.toEqual(error);
  });
});
