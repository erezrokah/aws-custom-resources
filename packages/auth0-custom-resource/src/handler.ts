import cfnLambda = require('cfn-lambda');
import { Auth0RequestParams } from './types';
import {
  getBearerToken,
  createClient,
  updateClient,
  deleteClient,
  Result,
} from './auth0';

const SEPARATOR = '---';

const getAppClientId = (requestPhysicalID: string) => {
  const parts = requestPhysicalID.split(SEPARATOR);
  const appClientId = parts[parts.length - 1];
  return appClientId;
};

const createResourceId = (domain: string, clientId: string) => {
  return ['Auth0', domain, clientId].join(SEPARATOR);
};

const createDataObject = (result: Result) => {
  const { client_id: ClientId, client_secret: ClientSecret } = result;

  return { ClientId, ClientSecret };
};

const createHandler: cfnLambda.AsyncCreateHandler = async cfnRequestParams => {
  try {
    const {
      Domain: domain,
      ManagementClientId: managementClientId,
      ManagementClientSecret: managementClientSecret,
      Body: body,
    } = cfnRequestParams as Auth0RequestParams;

    const token = await getBearerToken(
      domain,
      managementClientId,
      managementClientSecret,
    );
    const result = await createClient(domain, body, token);

    return {
      PhysicalResourceId: createResourceId(domain, result.client_id),
      FnGetAttrsDataObj: createDataObject(result),
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const updateHandler: cfnLambda.AsyncUpdateHandler = async (
  requestPhysicalID,
  cfnRequestParams,
) => {
  try {
    const {
      Domain: domain,
      ManagementClientId: managementClientId,
      ManagementClientSecret: managementClientSecret,
      Body: body,
    } = cfnRequestParams as Auth0RequestParams;

    const token = await getBearerToken(
      domain,
      managementClientId,
      managementClientSecret,
    );
    const appClientId = getAppClientId(requestPhysicalID);
    const result = await updateClient(domain, appClientId, body, token);

    return {
      PhysicalResourceId: createResourceId(domain, result.client_id),
      FnGetAttrsDataObj: createDataObject(result),
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const deleteHandler: cfnLambda.AsyncDeleteHandler = async (
  requestPhysicalID,
  cfnRequestParams,
) => {
  try {
    const {
      Domain: domain,
      ManagementClientId: managementClientId,
      ManagementClientSecret: managementClientSecret,
    } = cfnRequestParams as Auth0RequestParams;

    const token = await getBearerToken(
      domain,
      managementClientId,
      managementClientSecret,
    );
    const appClientId = getAppClientId(requestPhysicalID);
    const result = await deleteClient(domain, appClientId, token);

    return {
      PhysicalResourceId: createResourceId(domain, result.client_id),
      FnGetAttrsDataObj: createDataObject(result),
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const auth0 = cfnLambda({
  AsyncCreate: createHandler,
  AsyncUpdate: updateHandler,
  AsyncDelete: deleteHandler,
  SchemaPath: [__dirname, 'schema.json'],
  NoEcho: true,
});
