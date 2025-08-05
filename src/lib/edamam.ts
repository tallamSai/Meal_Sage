// Utility to fetch healthy recipes from Edamam Recipe Search API via local proxy or Vercel function

const getApiUrl = () => {
  // Use Vercel function in production, local proxy in development
  if (import.meta.env.PROD) {
    return '/api/edamam';
  } else {
    return 'http://localhost:3001/api/edamam';
  }
};

export async function fetchHealthyRecipes(query: string) {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}?q=${encodeURIComponent(query)}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Edamam API error:', errorData);
      throw new Error(`Failed to fetch recipes: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data.hits || [];
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
}

export async function fetchOpenFoodFacts(foodName: string): Promise<any[]> {
  const url = `https://in.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&search_simple=1&action=process&json=1`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).filter((p: any) => p.nutriments);
  } catch (error) {
    console.error('Error fetching Open Food Facts:', error);
    return [];
  }
}

export async function fetchRecipeWithFallback(foodName: string): Promise<any[]> {
  try {
    // Try Edamam first
    const edamamResults = await fetchHealthyRecipes(foodName);
    if (edamamResults && edamamResults.length > 0) {
      return edamamResults;
    }
    
    // Fallback to Open Food Facts for Indian foods
    return await fetchOpenFoodFacts(foodName);
  } catch (error) {
    console.error('Error in fetchRecipeWithFallback:', error);
    // Return empty array if all APIs fail
    return [];
  }
} 