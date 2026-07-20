export type AzureResource = {
  id: string;
  name: string;
  type: string;
  location: string;
  resourceGroup: string;
  subscriptionId: string;
  tags?: Record<string, string>;
};

export type ResourceTypeSummary = {
  resourceType: string;
  displayName: string;
  count: number;
};

export type ResourceGraphResponse = {
  totalRecords: number;
  count: number;
  data: AzureResource[];
  skipToken?: string;
};