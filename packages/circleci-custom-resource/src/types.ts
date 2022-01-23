export interface CircleCiRequestParams {
  ApiToken: string;
  Repo: string;
  Owner: string;
  PolicyArn?: string;
  EnvironmentVariables?: Array<{ name: string; value: string }>;
}
