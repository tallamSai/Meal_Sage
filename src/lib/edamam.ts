// Utility to fetch healthy recipes from Edamam Recipe Search API via local proxy

export async function fetchHealthyRecipes(query: string) {
  const url = `http://localhost:3001/api/edamam?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch recipes from Edamam proxy');
  const data = await res.json();
  return data.hits || [];
}

export async function fetchOpenFoodFacts(foodName: string): Promise<any[]> {
  const url = `https://in.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&search_simple=1&action=process&json=1`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.products || []).filter((p: any) => p.nutriments);
}

export async function fetchRecipeWithFallback(foodName: string): Promise<any[]> {
  // Try Edamam (or your main API) first
  const edamamResults = await fetchHealthyRecipes(foodName); // or fetchEdamam if that's your main function
  if (edamamResults && edamamResults.length > 0) return edamamResults;
  // Fallback to Open Food Facts for Indian foods
  return await fetchOpenFoodFacts(foodName);
} 