import IAM = require('aws-sdk/clients/iam');

const policyArn = 'arn:aws:iam::aws:policy/AdministratorAccess';

export const getIamUserName = (repo: string): string => `circleci-${repo}`;

export const deleteAllKeys = async (userName: string): Promise<void> => {
  console.log(`Deleting all access keys for user ${userName}`);
  const iam = new IAM();
  const result = await iam.listAccessKeys({ UserName: userName }).promise();

  await Promise.all(
    result.AccessKeyMetadata.map(({ UserName, AccessKeyId }) => {
      const userName = UserName as string;
      const accessKeyId = AccessKeyId as string;
      return iam
        .deleteAccessKey({ UserName: userName, AccessKeyId: accessKeyId })
        .promise();
    }),
  );
  console.log(`Done deleting all access keys for user ${userName}`);
};

export const createIamUser = async (
  userName: string,
): Promise<{ accessKeyId: string; secretAccessKey: string }> => {
  const iam = new IAM();

  try {
    console.log(`Creating IAM user ${userName}`);
    await iam.createUser({ UserName: userName }).promise();
    console.log(`Done creating IAM user ${userName}`);
  } catch (e) {
    if (e.code === 'EntityAlreadyExists') {
      console.log(`User ${userName} already exists`);
      await deleteAllKeys(userName);
    } else {
      throw e;
    }
  }

  console.log(`Attaching managed policy to user ${userName}`);
  await iam
    .attachUserPolicy({
      PolicyArn: policyArn,
      UserName: userName,
    })
    .promise();
  console.log(`Done attaching managed policy to user ${userName}`);

  console.log(`Creating access key for user ${userName}`);
  const { AccessKey } = await iam
    .createAccessKey({ UserName: userName })
    .promise();
  const {
    AccessKeyId: accessKeyId,
    SecretAccessKey: secretAccessKey,
  } = AccessKey;
  console.log(`Done creating access key for user ${userName}`);
  return { accessKeyId, secretAccessKey };
};

export const deleteIamUser = async (userName: string): Promise<void> => {
  const iam = new IAM();

  try {
    console.log(`Detaching IAM user ${userName} policy ${policyArn}`);
    await iam
      .detachUserPolicy({
        PolicyArn: policyArn,
        UserName: userName,
      })
      .promise();
    console.log(`Done detaching IAM user ${userName} policy ${policyArn}`);

    await deleteAllKeys(userName);

    console.log(`Deleting IAM user ${userName}`);
    await iam.deleteUser({ UserName: userName }).promise();
    console.log(`Done deleting IAM user ${userName}`);
  } catch (e) {
    if (e.code === 'NoSuchEntity') {
      console.log(`Policy ${policyArn} doesn't exists`);
    } else {
      throw e;
    }
  }
};
