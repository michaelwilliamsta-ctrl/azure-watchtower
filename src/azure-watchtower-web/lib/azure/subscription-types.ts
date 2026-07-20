export type AzureSubscriptionState =
  | "Enabled"
  | "Warned"
  | "PastDue"
  | "Disabled"
  | "Deleted"
  | string;

export type AzureSubscription = {
  id: string;
  subscriptionId: string;
  tenantId: string;
  displayName: string;
  state: AzureSubscriptionState;
};

export type AzureSubscriptionListResponse = {
  value: AzureSubscription[];
  nextLink?: string;
};