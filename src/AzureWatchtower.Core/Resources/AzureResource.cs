namespace AzureWatchtower.Core.Resources;

/// <summary>
/// Represents a security-relevant resource discovered in an Azure environment.
/// </summary>
public sealed class AzureResource
{
    public required string Id { get; init; }

    public required string Name { get; init; }

    public required string ResourceId { get; init; }

    public required string SubscriptionId { get; init; }

    public required string ResourceGroup { get; init; }

    public required string ResourceType { get; init; }

    public string? Location { get; init; }

    public IReadOnlyDictionary<string, string> Tags { get; init; }
        = new Dictionary<string, string>();

    public DateTimeOffset DiscoveredOn { get; init; }

    public DateTimeOffset LastUpdated { get; init; }
}