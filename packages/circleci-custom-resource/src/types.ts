export interface CircleCiRequestParams {
  ApiToken: string;
  Repo: string;
  Owner: string;
  EnvironmentVariables?: Array<{ name: string; value: string }>;
}
