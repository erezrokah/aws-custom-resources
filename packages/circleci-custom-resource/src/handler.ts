import cfnLambda = require('cfn-lambda');
import { getIamUserName, createIamUser, deleteIamUser } from './iam';
import { follow, setEnvs, updateProjectSettings, unfollow } from './circleci';

const createHandler: cfnLambda.AsyncCreateHandler = async cfnRequestParams => {
  try {
    const {
      ApiToken: token,
      Owner: owner,
      Repo: repo,
      EnvironmentVariables: envs = [],
    } = cfnRequestParams;
    const iamUser = getIamUserName(repo as string);
    const { accessKeyId, secretAccessKey } = await createIamUser(iamUser);

    await follow(token, owner, repo);
    await setEnvs(token, owner, repo, [
      ...envs,
      { name: 'AWS_ACCESS_KEY_ID', value: accessKeyId },
      { name: 'AWS_SECRET_ACCESS_KEY', value: secretAccessKey },
    ]);
    await updateProjectSettings(token, owner, repo);

    return {
      PhysicalResourceId: `CircleCI-${owner}-${repo}`,
      FnGetAttrsDataObj: {},
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
  const result = await createHandler(cfnRequestParams);
  return result;
};

const deleteHandler: cfnLambda.AsyncDeleteHandler = async (
  requestPhysicalID,
  cfnRequestParams,
) => {
  try {
    const { ApiToken: token, Owner: owner, Repo: repo } = cfnRequestParams;
    await unfollow(token, owner, repo);

    const iamUser = getIamUserName(repo);
    await deleteIamUser(iamUser);
    return {
      PhysicalResourceId: `CircleCI-${owner}-${repo}`,
      FnGetAttrsDataObj: {},
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const circleci = cfnLambda({
  AsyncCreate: createHandler,
  AsyncUpdate: updateHandler,
  AsyncDelete: deleteHandler,
  SchemaPath: [__dirname, 'schema.json'],
});
