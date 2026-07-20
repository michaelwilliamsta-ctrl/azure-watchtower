import type {
  AzureResource,
  ResourceGraphResponse,
  ResourceTypeSummary,
} from "./inventory-types";

const resourceGraphEndpoint =
  "https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2024-04-01";

const inventoryQuery = `
Resources
| project
    id,
    name,
    type = tolower(type),
    location,
    resourceGroup,
    subscriptionId,
    tags
| order by type asc, name asc
`;

type ResourceGraphRequest = {
  subscriptions: string[];
  query: string;
  options?: {
    resultFormat: "objectArray";
    skipToken?: string;
  };
};

export class ResourceGraphApiError extends Error {
  public readonly status: number;
  public readonly responseBody: string;

  public constructor(
    message: string,
    status: number,
    responseBody: string,
  ) {
    super(message);
    this.name = "ResourceGraphApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export async function querySubscriptionResources(
  accessToken: string,
  subscriptionId: string,
): Promise<AzureResource[]> {
  const resources: AzureResource[] = [];
  let skipToken: string | undefined;

  do {
    const requestBody: ResourceGraphRequest = {
      subscriptions: [subscriptionId],
      query: inventoryQuery,
      options: {
        resultFormat: "objectArray",
        ...(skipToken ? { skipToken } : {}),
      },
    };

    const response = await fetch(resourceGraphEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const responseBody = await response.text();

      throw new ResourceGraphApiError(
        `Azure Resource Graph returned status ${response.status}.`,
        response.status,
        responseBody,
      );
    }

    const result = (await response.json()) as ResourceGraphResponse;

    resources.push(...result.data);
    skipToken = result.skipToken;
  } while (skipToken);

  return resources;
}

export function summarizeResourcesByType(
  resources: AzureResource[],
): ResourceTypeSummary[] {
  const counts = new Map<string, number>();

  for (const resource of resources) {
    counts.set(
      resource.type,
      (counts.get(resource.type) ?? 0) + 1,
    );
  }

  return Array.from(counts.entries())
    .map(([resourceType, count]) => ({
      resourceType,
      displayName: formatResourceType(resourceType),
      count,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.displayName.localeCompare(right.displayName);
    });
}

function formatResourceType(resourceType: string): string {
  const resourceName =
    resourceType.split("/").at(-1) ?? resourceType;

  return resourceName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}