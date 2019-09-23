export interface Auth0RequestParams {
  Domain: string;
  ManagementClientId: string;
  ManagementClientSecret: string;
  Body: Record<string, unknown>;
}
