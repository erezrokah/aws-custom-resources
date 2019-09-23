/* eslint-disable @typescript-eslint/no-var-requires */
import { auth0 } from './handler';
import {
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceUpdateEvent,
  CloudFormationCustomResourceDeleteEvent,
  Context,
} from 'aws-lambda';

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

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

jest.mock('./auth0');

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
    getBearerToken,
    createClient,
    updateClient,
    deleteClient,
  }: {
    getBearerToken: jest.Mock;
    createClient: jest.Mock;
    updateClient: jest.Mock;
    deleteClient: jest.Mock;
  } = require('./auth0');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return failed status on validation error', async () => {
    const event: CloudFormationCustomResourceCreateEvent = {
      ...commonEvent,
      RequestType: 'Create',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        Domain: 'Domain',
      },
    };

    await auth0(event, context, callback);

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
      NoEcho: true,
    });
    expect(reason[0][1]).toEqual([
      'message ==>',
      'requires property "ManagementClientId"',
    ]);
    expect(reason[1][1]).toEqual([
      'message ==>',
      'requires property "ManagementClientSecret"',
    ]);
    expect(reason[2][1]).toEqual(['message ==>', 'requires property "Body"']);
  });

  test('should call createClient on Create', async () => {
    const event: CloudFormationCustomResourceCreateEvent = {
      ...commonEvent,
      RequestType: 'Create',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        Domain: 'Domain',
        ManagementClientId: 'ManagementClientId',
        ManagementClientSecret: 'ManagementClientSecret',
        Body: {
          name: 'name',
        },
      },
    };

    const token = 'token';
    getBearerToken.mockReturnValue(Promise.resolve(token));
    const result = { client_id: 'client_id', client_secret: 'client_id' };
    createClient.mockReturnValue(Promise.resolve(result));

    const writePromise = new Promise(resolve => {
      request.write.mockImplementation(() => {
        resolve();
        return Promise.resolve();
      });
    });

    await auth0(event, context, callback);
    await writePromise;

    const response = JSON.parse(request.write.mock.calls[0][0]);
    expect(response).toEqual({
      LogicalResourceId: 'LogicalResourceId',
      PhysicalResourceId: 'Auth0---Domain---client_id',
      StackId: 'StackId',
      RequestId: 'RequestId',
      Status: 'SUCCESS',
      Data: { ClientId: 'client_id', ClientSecret: 'client_id' },
      NoEcho: true,
    });

    expect(getBearerToken).toHaveBeenCalledTimes(1);
    expect(getBearerToken).toHaveBeenCalledWith(
      event.ResourceProperties.Domain,
      event.ResourceProperties.ManagementClientId,
      event.ResourceProperties.ManagementClientSecret,
    );

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      event.ResourceProperties.Domain,
      event.ResourceProperties.Body,
      token,
    );
  });

  test('should log and throw error on create resource error', async () => {
    const event: CloudFormationCustomResourceCreateEvent = {
      ...commonEvent,
      RequestType: 'Create',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        Domain: 'Domain',
        ManagementClientId: 'ManagementClientId',
        ManagementClientSecret: 'ManagementClientSecret',
        Body: {
          name: 'name',
        },
      },
    };

    const error = new Error('some error');
    getBearerToken.mockReturnValue(Promise.reject(error));

    const writePromise = new Promise(resolve => {
      request.write.mockImplementation(() => {
        resolve();
        return Promise.resolve();
      });
    });

    await auth0(event, context, callback);
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
      NoEcho: true,
    });
  });

  test('should call updateClient on Update', async () => {
    const event: CloudFormationCustomResourceUpdateEvent = {
      ...commonEvent,
      RequestType: 'Update',
      PhysicalResourceId: 'Auth0---Domain---client_id',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        Domain: 'Domain',
        ManagementClientId: 'ManagementClientId',
        ManagementClientSecret: 'ManagementClientSecret',
        Body: {
          name: 'name',
        },
      },
      OldResourceProperties: {},
    };

    const token = 'token';
    getBearerToken.mockReturnValue(Promise.resolve(token));
    const result = { client_id: 'client_id', client_secret: 'client_id' };
    updateClient.mockReturnValue(Promise.resolve(result));

    const writePromise = new Promise(resolve => {
      request.write.mockImplementation(() => {
        resolve();
        return Promise.resolve();
      });
    });

    await auth0(event, context, callback);
    await writePromise;

    const response = JSON.parse(request.write.mock.calls[0][0]);
    expect(response).toEqual({
      LogicalResourceId: 'LogicalResourceId',
      PhysicalResourceId: 'Auth0---Domain---client_id',
      StackId: 'StackId',
      RequestId: 'RequestId',
      Status: 'SUCCESS',
      Data: { ClientId: 'client_id', ClientSecret: 'client_id' },
      NoEcho: true,
    });

    expect(getBearerToken).toHaveBeenCalledTimes(1);
    expect(getBearerToken).toHaveBeenCalledWith(
      event.ResourceProperties.Domain,
      event.ResourceProperties.ManagementClientId,
      event.ResourceProperties.ManagementClientSecret,
    );

    expect(updateClient).toHaveBeenCalledTimes(1);
    expect(updateClient).toHaveBeenCalledWith(
      event.ResourceProperties.Domain,
      'client_id',
      event.ResourceProperties.Body,
      token,
    );
  });

  test('should log and throw error on update resource error', async () => {
    const event: CloudFormationCustomResourceUpdateEvent = {
      ...commonEvent,
      RequestType: 'Update',
      PhysicalResourceId: 'Auth0---Domain---client_id',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        Domain: 'Domain',
        ManagementClientId: 'ManagementClientId',
        ManagementClientSecret: 'ManagementClientSecret',
        Body: {
          name: 'name',
        },
      },
      OldResourceProperties: {},
    };

    const error = new Error('some error');
    getBearerToken.mockReturnValue(Promise.reject(error));

    const writePromise = new Promise(resolve => {
      request.write.mockImplementation(() => {
        resolve();
        return Promise.resolve();
      });
    });

    await auth0(event, context, callback);
    await writePromise;

    expect(request.write).toHaveBeenCalledTimes(1);

    expect(console.error).toHaveBeenCalledWith(error);

    const response = JSON.parse(request.write.mock.calls[0][0]);
    expect(response).toEqual({
      LogicalResourceId: 'LogicalResourceId',
      PhysicalResourceId: 'Auth0---Domain---client_id',
      Reason: 'some error',
      StackId: 'StackId',
      RequestId: 'RequestId',
      Status: 'FAILED',
      NoEcho: true,
    });
  });

  test('should call deleteClient on Delete', async () => {
    const event: CloudFormationCustomResourceDeleteEvent = {
      ...commonEvent,
      RequestType: 'Delete',
      PhysicalResourceId: 'Auth0---Domain---client_id',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        Domain: 'Domain',
        ManagementClientId: 'ManagementClientId',
        ManagementClientSecret: 'ManagementClientSecret',
        Body: {
          name: 'name',
        },
      },
    };

    const token = 'token';
    getBearerToken.mockReturnValue(Promise.resolve(token));
    const result = { client_id: 'client_id', client_secret: 'client_id' };
    deleteClient.mockReturnValue(Promise.resolve(result));

    const writePromise = new Promise(resolve => {
      request.write.mockImplementation(() => {
        resolve();
        return Promise.resolve();
      });
    });

    await auth0(event, context, callback);
    await writePromise;

    const response = JSON.parse(request.write.mock.calls[0][0]);
    expect(response).toEqual({
      LogicalResourceId: 'LogicalResourceId',
      PhysicalResourceId: 'Auth0---Domain---client_id',
      StackId: 'StackId',
      RequestId: 'RequestId',
      Status: 'SUCCESS',
      Data: { ClientId: 'client_id', ClientSecret: 'client_id' },
      NoEcho: true,
    });

    expect(getBearerToken).toHaveBeenCalledTimes(1);
    expect(getBearerToken).toHaveBeenCalledWith(
      event.ResourceProperties.Domain,
      event.ResourceProperties.ManagementClientId,
      event.ResourceProperties.ManagementClientSecret,
    );

    expect(deleteClient).toHaveBeenCalledTimes(1);
    expect(deleteClient).toHaveBeenCalledWith(
      event.ResourceProperties.Domain,
      'client_id',
      token,
    );
  });

  test('should log and throw error on delete resource error', async () => {
    const event: CloudFormationCustomResourceDeleteEvent = {
      ...commonEvent,
      RequestType: 'Delete',
      PhysicalResourceId: 'Auth0---Domain---client_id',
      ResourceProperties: {
        ...commonEvent.ResourceProperties,
        Domain: 'Domain',
        ManagementClientId: 'ManagementClientId',
        ManagementClientSecret: 'ManagementClientSecret',
        Body: {
          name: 'name',
        },
      },
    };

    const error = new Error('some error');
    getBearerToken.mockReturnValue(Promise.reject(error));

    const writePromise = new Promise(resolve => {
      request.write.mockImplementation(() => {
        resolve();
        return Promise.resolve();
      });
    });

    await auth0(event, context, callback);
    await writePromise;

    expect(request.write).toHaveBeenCalledTimes(1);

    expect(console.error).toHaveBeenCalledWith(error);

    const response = JSON.parse(request.write.mock.calls[0][0]);
    expect(response).toEqual({
      LogicalResourceId: 'LogicalResourceId',
      PhysicalResourceId: 'Auth0---Domain---client_id',
      Reason: 'some error',
      StackId: 'StackId',
      RequestId: 'RequestId',
      Status: 'FAILED',
      NoEcho: true,
    });
  });
});
