# auth0-custom-resource

## Usage

Follow the steps [here](https://auth0.com/docs/api/management/v2/create-m2m-app) to register a Machine-to-Machine Application and get your `ManagementClientId` and `ManagementClientSecret`.

You application should have the `create:clients,update:clients,delete:clients` permissions.

Then deploy the resource:

```bash
STAGE=prod REGION=us-east-1 npm run deploy
```

Finally in your CloudFormation template:

```yaml
Parameters:
  ManagementClientSecretParameter:
    Type: String
    Default: ${env:AUTH0_MANAGEMENT_CLIENT_SECRET}
    NoEcho: true

Resources:
  Auth0:
    Type: 'Custom::Auth0'
    Version: '1.0'
    Properties:
      ServiceToken:
        Fn::ImportValue: 'auth0-custom-resource:prod:ServiceToken'
      Domain: <auth0_domain>
      ManagementClientId: <auth0_management_client_id>
      ManagementClientSecret: { Ref: ManagementClientSecretParameter }
      Body:
        # name is required. You can pass any a additional parameters specified here https://auth0.com/docs/api/management/v2#!/Clients/post_clients
        name: auth0-app-custom-resource-prod
Outputs:
  ClientId:
    Value: !GetAtt Auth0.ClientId
  ClientSecret:
    Value: !GetAtt Auth0.ClientSecret
```
