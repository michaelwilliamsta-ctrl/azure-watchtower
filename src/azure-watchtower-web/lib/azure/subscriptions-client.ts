import type {
  AzureSubscription,
  AzureSubscriptionListResponse,
} from "./subscription-types";

const subscriptionsEndpoint =
  "https://management.azure.com/subscriptions?api-version=2022-12-01";

export class AzureApiError extends Error {
  public readonly status: number;
  public readonly responseBody: string;

  public constructor(
    message: string,
    status: number,
    responseBody: string,
  ) {
    super(message);
    this.name = "AzureApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export async function listAzureSubscriptions(
  accessToken: string,
): Promise<AzureSubscription[]> {
  const subscriptions: AzureSubscription[] = [];
  let nextUrl: string | undefined = subscriptionsEndpoint;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const responseBody = await response.text();

      throw new AzureApiError(
        `Azure Resource Manager returned status ${response.status}.`,
        response.status,
        responseBody,
      );
    }

    const result =
      (await response.json()) as AzureSubscriptionListResponse;

    subscriptions.push(...result.value);
    nextUrl = result.nextLink;
  }

  return subscriptions.sort((left, right) =>
    left.displayName.localeCompare(right.displayName),
  );
}