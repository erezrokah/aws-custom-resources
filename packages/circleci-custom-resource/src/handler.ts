import cfnLambda = require('cfn-lambda');
import { getIamUserName, createIamUser, deleteIamUser } from './iam';
import { follow, setEnvs, updateProjectSettings, unfollow } from './circleci';
import { CircleCiRequestParams } from './types';

const getAwsEnv = async (
  policyArn: string | undefined,
  owner: string,
  repo: string,
) => {
  if (!policyArn) {
    return [];
  }

  const iamUser = getIamUserName(owner, repo);
  const { accessKeyId, secretAccessKey } = await createIamUser(
    iamUser,
    policyArn,
  );

  return [
    { name: 'AWS_ACCESS_KEY_ID', value: accessKeyId },
    { name: 'AWS_SECRET_ACCESS_KEY', value: secretAccessKey },
  ];
};

const getReturnValue = (owner: string, repo: string) => {
  return {
    PhysicalResourceId: `CircleCI-${owner}-${repo}`,
    FnGetAttrsDataObj: {},
  };
};

const createHandler: cfnLambda.AsyncCreateHandler = async (
  cfnRequestParams,
) => {
  try {
    const {
      ApiToken: token,
      Owner: owner,
      Repo: repo,
      PolicyArn: policyArn,
      EnvironmentVariables: envs = [],
    } = cfnRequestParams as CircleCiRequestParams;

    const awsEnvs = await getAwsEnv(policyArn, owner, repo);
    await follow(token, owner, repo);
    await setEnvs(token, owner, repo, [...envs, ...awsEnvs]);
    await updateProjectSettings(token, owner, repo);

    return getReturnValue(owner, repo);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const updateHandler: cfnLambda.AsyncUpdateHandler = async (
  requestPhysicalID,
  cfnRequestParams,
  oldCfnRequestParams,
) => {
  // cleanup old IAM user if the policy has changed
  const { PolicyArn: policyArn } = cfnRequestParams as CircleCiRequestParams;
  const {
    Owner: owner,
    Repo: repo,
    PolicyArn: oldPolicyArn,
  } = oldCfnRequestParams as CircleCiRequestParams;

  if (policyArn !== oldPolicyArn && oldPolicyArn !== undefined) {
    const iamUser = getIamUserName(owner, repo);
    await deleteIamUser(iamUser, oldPolicyArn);
  }

  const result = await createHandler(cfnRequestParams);
  return result;
};

const deleteHandler: cfnLambda.AsyncDeleteHandler = async (
  requestPhysicalID,
  cfnRequestParams,
) => {
  try {
    const {
      ApiToken: token,
      Owner: owner,
      Repo: repo,
      PolicyArn: policyArn,
    } = cfnRequestParams as CircleCiRequestParams;
    await unfollow(token, owner, repo);

    if (policyArn) {
      const iamUser = getIamUserName(owner, repo);
      await deleteIamUser(iamUser, policyArn);
    }

    return getReturnValue(owner, repo);
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
