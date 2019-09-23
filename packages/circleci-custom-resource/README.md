# circleci-custom-resource

## Usage

Create a CircleCI Api Token [here](https://circleci.com/account/api).

Then deploy the resource:

```bash
STAGE=prod REGION=us-east-1 yarn deploy
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
      Owner: ${env:CIRCLECI_OWNER}
      Repo: ${env:CIRCLECI_REPO}
      # Optional Environment Variables
      EnvironmentVariables:
        - name: name
          value: value
```
