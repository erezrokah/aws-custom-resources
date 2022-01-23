# circleci-custom-resource

## Usage

Create a CircleCI Api Token [here](https://circleci.com/account/api).

Then deploy the resource:

```bash
STAGE=prod REGION=us-east-1 npm run deploy
```

Finally in your CloudFormation template:

```yaml
Parameters:
  ApiTokenParameter:
    Type: String
    Default: ${env:CIRCLECI_API_TOKEN}
    NoEcho: true

Resources:
  CircleCI:
    Type: 'Custom::CircleCI'
    Version: '1.0'
    Properties:
      ServiceToken:
        Fn::ImportValue: 'circleci-custom-resource:prod:ServiceToken'
      ApiToken: { Ref: ApiTokenParameter }
      Owner: <repo-owner>
      Repo: <repo-name>
      # Optional, if the CircleCI project needs access to AWS resources adding a policy
      # will configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY as nnvironment variables
      PolicyArn: <policy-arn>
      # Optional Environment Variables
      EnvironmentVariables:
        - name: name
          value: value
```
