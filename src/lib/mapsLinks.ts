export type NavigationLinks = {
  query: string;
  googleMapsUrl: string;
  wazeUrl: string;
};

export function buildDeliveryNavigationLinks(
  address?: string | null,
  neighborhood?: string | null,
): NavigationLinks | null {
  const parts = [neighborhood, address].filter((p) => p && p.trim() !== '');
  if (parts.length === 0) {
    return null;
  }

  const query = parts.join(', ');
  const encoded = encodeURIComponent(query);

  return {
    query,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    wazeUrl: `https://waze.com/ul?q=${encoded}&navigate=yes`,
  };
}
