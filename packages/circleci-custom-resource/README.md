# circleci-custom-resource

## Usage

first deploy the resource

```bash
STAGE=prod REGION=us-east-1 yarn deploy
```

Then in your CloudFormation template:

```yaml
Resources:
  CircleCI:
    Type: 'Custom::CircleCI'
    Version: '1.0'
    Properties:
      ServiceToken:
        Fn::ImportValue: 'circleci-custom-resource:prod:ServiceToken'
      ApiToken: ApiTokenValue
      Owner: RepoOwnerValue
      Repo: RepoNameValue
      # Optional Environment Variables
      EnvironmentVariables:
        - name: name
          value: value
```
