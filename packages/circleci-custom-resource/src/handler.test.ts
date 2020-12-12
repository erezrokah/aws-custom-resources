/* eslint-disable @typescript-eslint/no-var-requires */
import { circleci } from './handler';
import {
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceUpdateEvent,
  CloudFormationCustomResourceDeleteEvent,
  Context,
} from 'aws-lambda';

jest.spyOn(console, 'log').mockImplementation(() => undefined);
jest.spyOn(console, 'error').mockImplementation(() => undefined);

jest.mock('https', () => {
  const request = {
    on: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  };
  return {
    request: jest.fn(() => request),
  };
});

jest.mock('./iam');
jest.mock('./circleci');

describe('handler', () => {
  const commonEvent = {
    RequestType: 'Create',
    ServiceToken: 'ServiceToken',
    ResponseURL: 'ResponseURL',
    StackId: 'StackId',
    RequestId: 'RequestId',
    LogicalResourceId: 'LogicalResourceId',
    ResourceType: 'ResourceType',
    ResourceProperties: {
      ServiceToken: 'ServiceToken',
    },
  };
  const done = jest.fn();
  const callback = jest.fn();

  const context = ({
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456:function:create',
    done,
  } as unknown) as Context;

  const request = require('https').request();

  const {
    getIamUserName,
    createIamUser,
    deleteIamUser,
  }: {
    getIamUserName: jest.Mock;
    createIamUser: jest.Mock;
    deleteIamUser: jest.Mock;
  } = require('./iam');

  const {
    follow,
    setEnvs,
    updateProjectSettings,
    unfollow,
  }: {
    follow: jest.Mock;
    setEnvs: jest.Mock;
    updateProjectSettings: jest.Mock;
    unfollow: jest.Mock;
  } = require('./circleci');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return failed status on validation error', async () => {
    const event: CloudFormationCustomResourceCreateEvent = {
      ...commonEvent,
      RequestType: 'Create',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        ApiToken: 'ApiToken',
      },
    };

    await circleci(event, context, callback);

    expect(request.write).toHaveBeenCalledTimes(1);

    const response = JSON.parse(request.write.mock.calls[0][0]);
    const reason = JSON.parse(response.Reason);
    expect(response).toEqual({
      LogicalResourceId: 'LogicalResourceId',
      PhysicalResourceId: 'StackId/LogicalResourceId/RequestId',
      StackId: 'StackId',
      Reason: expect.any(String),
      RequestId: 'RequestId',
      Status: 'FAILED',
      NoEcho: false,
    });
    expect(reason[0][1]).toEqual(['message ==>', 'requires property "Owner"']);
    expect(reason[1][1]).toEqual(['message ==>', 'requires property "Repo"']);
  });

  const validateEvent = async (
    event:
      | CloudFormationCustomResourceCreateEvent
      | CloudFormationCustomResourceUpdateEvent,
  ) => {
    const iamUser = 'iamUser';
    getIamUserName.mockReturnValue(iamUser);

    const createIamUserResult = {
      accessKeyId: 'accessKeyId',
      secretAccessKey: 'secretAccessKey',
    };
    createIamUser.mockReturnValue(Promise.resolve(createIamUserResult));

    follow.mockReturnValue(Promise.resolve());
    setEnvs.mockReturnValue(Promise.resolve());
    updateProjectSettings.mockReturnValue(Promise.resolve());

    const writePromise = new Promise<void>((resolve) => {
      request.write.mockImplementation(() => {
        resolve();
        return Promise.resolve();
      });
    });

    await circleci(event, context, callback);
    await writePromise;

    expect(request.write).toHaveBeenCalledTimes(1);

    const response = JSON.parse(request.write.mock.calls[0][0]);
    expect(response).toEqual({
      LogicalResourceId: 'LogicalResourceId',
      PhysicalResourceId: 'CircleCI-owner-repo',
      StackId: 'StackId',
      RequestId: 'RequestId',
      Status: 'SUCCESS',
      Data: {},
      NoEcho: false,
    });

    expect(getIamUserName).toHaveBeenCalledTimes(1);
    expect(getIamUserName).toHaveBeenCalledWith(event.ResourceProperties.Repo);
    expect(createIamUser).toHaveBeenCalledTimes(1);
    expect(createIamUser).toHaveBeenCalledWith(iamUser);
    expect(follow).toHaveBeenCalledTimes(1);
    expect(follow).toHaveBeenCalledWith(
      event.ResourceProperties.ApiToken,
      event.ResourceProperties.Owner,
      event.ResourceProperties.Repo,
    );
    expect(setEnvs).toHaveBeenCalledTimes(1);
    expect(setEnvs).toHaveBeenCalledWith(
      event.ResourceProperties.ApiToken,
      event.ResourceProperties.Owner,
      event.ResourceProperties.Repo,
      [
        ...(event.ResourceProperties.EnvironmentVariables || []),
        { name: 'AWS_ACCESS_KEY_ID', value: createIamUserResult.accessKeyId },
        {
          name: 'AWS_SECRET_ACCESS_KEY',
          value: createIamUserResult.secretAccessKey,
        },
      ],
    );
    expect(updateProjectSettings).toHaveBeenCalledTimes(1);
    expect(updateProjectSettings).toHaveBeenCalledWith(
      event.ResourceProperties.ApiToken,
      event.ResourceProperties.Owner,
      event.ResourceProperties.Repo,
    );
  };

  test('should create IAM user, keys and follow project on create resource', async () => {
    const event: CloudFormationCustomResourceCreateEvent = {
      ...commonEvent,
      RequestType: 'Create',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        ApiToken: 'ApiToken',
        Owner: 'owner',
        Repo: 'repo',
      },
    };

    await validateEvent(event);
  });

  test('should create IAM user, keys, follow project and set envs on create resource', async () => {
    const event: CloudFormationCustomResourceCreateEvent = {
      ...commonEvent,
      RequestType: 'Create',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        ApiToken: 'ApiToken',
        Owner: 'owner',
        Repo: 'repo',
        EnvironmentVariables: [
          { name: 'env1', value: 'value1' },
          { name: 'env2', value: 'value2' },
        ],
      },
    };

    await validateEvent(event);
  });

  test('should log and throw error on create resource error', async () => {
    const event: CloudFormationCustomResourceCreateEvent = {
      ...commonEvent,
      RequestType: 'Create',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        ApiToken: 'ApiToken',
        Owner: 'owner',
        Repo: 'repo',
      },
    };

    const iamUser = 'iamUser';
    getIamUserName.mockReturnValue(iamUser);

    const error = new Error('some error');
    createIamUser.mockReturnValue(Promise.reject(error));

    const writePromise = new Promise<void>((resolve) => {
      request.write.mockImplementation(() => {
        resolve();
        return Promise.resolve();
      });
    });

    await circleci(event, context, callback);
    await writePromise;

    expect(request.write).toHaveBeenCalledTimes(1);

    expect(console.error).toHaveBeenCalledWith(error);

    const response = JSON.parse(request.write.mock.calls[0][0]);
    expect(response).toEqual({
      LogicalResourceId: 'LogicalResourceId',
      PhysicalResourceId: 'StackId/LogicalResourceId/RequestId',
      Reason: 'some error',
      StackId: 'StackId',
      RequestId: 'RequestId',
      Status: 'FAILED',
      NoEcho: false,
    });
  });

  test('should create IAM user, keys and follow project on create resource', async () => {
    const event: CloudFormationCustomResourceUpdateEvent = {
      ...commonEvent,
      PhysicalResourceId: 'CircleCI-owner-repo',
      RequestType: 'Update',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        ApiToken: 'ApiToken',
        Owner: 'owner',
        Repo: 'repo',
      },
      OldResourceProperties: {
        ...commonEvent.ResourceProperties,
      },
    };

    await validateEvent(event);
  });

  test('should unfollow project and delete IAM user on delete resource', async () => {
    const event: CloudFormationCustomResourceDeleteEvent = {
      ...commonEvent,
      PhysicalResourceId: 'CircleCI-owner-repo',
      RequestType: 'Delete',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        ApiToken: 'ApiToken',
        Owner: 'owner',
        Repo: 'repo',
      },
    };

    const iamUser = 'iamUser';
    getIamUserName.mockReturnValue(iamUser);

    const writePromise = new Promise<void>((resolve) => {
      request.write.mockImplementation(() => {
        resolve();
        return Promise.resolve();
      });
    });

    await circleci(event, context, callback);
    await writePromise;

    expect(request.write).toHaveBeenCalledTimes(1);

    const response = JSON.parse(request.write.mock.calls[0][0]);
    expect(response).toEqual({
      LogicalResourceId: 'LogicalResourceId',
      PhysicalResourceId: 'CircleCI-owner-repo',
      StackId: 'StackId',
      RequestId: 'RequestId',
      Status: 'SUCCESS',
      Data: {},
      NoEcho: false,
    });

    expect(unfollow).toHaveBeenCalledTimes(1);
    expect(unfollow).toHaveBeenCalledWith(
      event.ResourceProperties.ApiToken,
      event.ResourceProperties.Owner,
      event.ResourceProperties.Repo,
    );
    expect(getIamUserName).toHaveBeenCalledTimes(1);
    expect(getIamUserName).toHaveBeenCalledWith(event.ResourceProperties.Repo);
    expect(deleteIamUser).toHaveBeenCalledTimes(1);
    expect(deleteIamUser).toHaveBeenCalledWith(iamUser);
  });

  test('should log and throw error on delete resource error', async () => {
    const event: CloudFormationCustomResourceDeleteEvent = {
      ...commonEvent,
      PhysicalResourceId: 'CircleCI-owner-repo',
      RequestType: 'Delete',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        ApiToken: 'ApiToken',
        Owner: 'owner',
        Repo: 'repo',
      },
    };

    const iamUser = 'iamUser';
    getIamUserName.mockReturnValue(iamUser);

    const error = new Error('some error');
    unfollow.mockReturnValue(Promise.reject(error));

    const writePromise = new Promise<void>((resolve) => {
      request.write.mockImplementation(() => {
        resolve();
        return Promise.resolve();
      });
    });

    await circleci(event, context, callback);
    await writePromise;

    expect(request.write).toHaveBeenCalledTimes(1);

    expect(console.error).toHaveBeenCalledWith(error);

    const response = JSON.parse(request.write.mock.calls[0][0]);
    expect(response).toEqual({
      LogicalResourceId: 'LogicalResourceId',
      PhysicalResourceId: 'CircleCI-owner-repo',
      Reason: 'some error',
      StackId: 'StackId',
      RequestId: 'RequestId',
      Status: 'FAILED',
      NoEcho: false,
    });
  });
});
