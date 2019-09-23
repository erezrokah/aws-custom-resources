declare module 'cfn-lambda' {
  import { CloudFormationCustomResourceHandler } from 'aws-lambda';

  namespace cfnLambda {
    export type CfnRequestParams = {};

    export interface AsyncHandlerResult {
      PhysicalResourceId: string;
      FnGetAttrsDataObj: Record<string, string>;
    }

    export type AsyncCreateHandler = (
      cfnRequestParams: CfnRequestParams,
    ) => Promise<AsyncHandlerResult>;

    export type AsyncUpdateHandler = (
      requestPhysicalID: string,
      cfnRequestParams: CfnRequestParams,
      oldCfnRequestParams: CfnRequestParams,
    ) => Promise<AsyncHandlerResult>;

    export type AsyncDeleteHandler = (
      requestPhysicalID: string,
      cfnRequestParams: CfnRequestParams,
    ) => Promise<AsyncHandlerResult>;

    export interface CfnLambdaParams {
      AsyncCreate: AsyncCreateHandler;
      AsyncUpdate: AsyncUpdateHandler;
      AsyncDelete: AsyncDeleteHandler;
      SchemaPath: string[];
      NoEcho?: boolean;
    }
  }

  function cfnLambda(
    params: cfnLambda.CfnLambdaParams,
  ): CloudFormationCustomResourceHandler;

  export = cfnLambda;
}
