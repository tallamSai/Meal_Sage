import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable for Gemini API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Check if API key is available
if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY is not set. Gemini AI features will not work.');
}

// Note: In production, store API keys securely using environment variables
const genAI = new GoogleGenerativeAI(API_KEY || 'dummy-key');

export interface NutritionalInfo {
  foodItem: string;
  confidence: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  healthScore: number;
  recommendations: string[];
}

export const analyzeFood = async (imageFile: File): Promise<NutritionalInfo> => {
  try {
    // Check if API key is available
    if (!API_KEY) {
      throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY environment variable.');
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Convert file to base64
    const imageBase64 = await fileToBase64(imageFile);
    
    const prompt = `
      Analyze this food image and provide detailed nutritional information. 
      Identify the food item(s) and estimate nutritional values per serving.
      
      IMPORTANT: You must respond with ONLY valid JSON in this exact format. Do not include any text before or after the JSON.
      
      {
        "foodItem": "name of the food",
        "confidence": 0.85,
        "nutrition": {
          "calories": 250,
          "protein": 15,
          "carbs": 30,
          "fat": 10,
          "fiber": 5,
          "sugar": 8,
          "sodium": 400
        },
        "healthScore": 7.5,
        "recommendations": [
          "Good source of protein",
          "Consider reducing sodium intake",
          "Pair with vegetables for better nutrition"
        ]
      }
      
      Make sure all nutritional values are realistic estimates based on typical serving sizes.
      Health score should be 1-10 (10 being healthiest).
      Provide 3-5 practical recommendations.
      Respond with ONLY the JSON object, no additional text.
    `;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: imageFile.type,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response with proper error handling
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid response from AI model');
    }
    
    // Log the response for debugging
    console.log('Gemini API Response:', text);
    
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('Could not parse nutritional information from response. The AI may not have returned valid JSON format.');
    }
    
    try {
    const nutritionData = JSON.parse(jsonMatch[0]);
    return nutritionData;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw JSON string:', jsonMatch[0]);
      throw new Error('Failed to parse JSON response from AI model');
    }
  } catch (error) {
    console.error('Error analyzing food:', error);
    throw new Error('Failed to analyze food image. Please try again.');
  }
};

export async function geminiHealthyAlternative(foodName: string) {
  // This is a placeholder implementation. Replace with actual Gemini API call if available.
  // For now, return a mock result for demo purposes.
  return {
    title: `Healthy Alternative for ${foodName}`,
    nutritionFacts: 'Calories: 350, Protein: 25g, Carbs: 40g, Fat: 10g, Fiber: 8g, Sugar: 5g, Sodium: 300mg',
    description: `A nutritious, balanced meal prep inspired by ${foodName}, but with healthier ingredients and cooking methods.`,
    steps: [
      { text: 'Prepare all ingredients: lean protein, whole grains, and fresh vegetables.', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=200&fit=crop' },
      { text: 'Cook the grains and protein separately using minimal oil.', imageUrl: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=300&h=200&fit=crop' },
      { text: 'Assemble the meal in a bowl, layering grains, protein, and veggies.', imageUrl: 'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?w=300&h=200&fit=crop' },
      { text: 'Top with a light, homemade dressing or herbs.', imageUrl: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=300&h=200&fit=crop' },
    ],
  };
}

export async function geminiRatePackagedFood(nutrition: any, productName: string) {
  const prompt = `
    Given the following nutrition facts for a packaged food product called "${productName}":
    ${JSON.stringify(nutrition, null, 2)}
    Rate how healthy or unhealthy this product is on a scale of 1 (very unhealthy) to 10 (very healthy).
    Provide a short explanation (1-2 sentences) for your rating, considering calories, protein, carbs, fat, sugar, sodium, and fiber.
    Respond in this exact JSON format:
    {
      "healthScore": 5,
      "explanation": "This product is high in sugar and sodium, making it less healthy."
    }
  `;
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const result = await model.generateContent([prompt]);
  const response = await result.response;
  const text = response.text();
  
  // Add proper error handling for text response
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid response from AI model');
  }
  
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('No JSON found in health rating response:', text);
    throw new Error('Could not parse health rating from AI');
  }
  
  try {
  return JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('Health rating JSON parse error:', parseError);
    throw new Error('Failed to parse health rating response from AI model');
  }
}

export interface Recipe {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  tips: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const generateRecipes = async (ingredients: string[]): Promise<Recipe[]> => {
  try {
    // Check if API key is available
    if (!API_KEY) {
      throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY environment variable.');
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const prompt = `
      Generate 2-3 creative and delicious recipes using ONLY these ingredients: ${ingredients.join(', ')}.
      
      IMPORTANT: You must respond with ONLY valid JSON in this exact format. Do not include any text before or after the JSON.
      
      [
        {
          "title": "Recipe Name",
          "description": "Brief description of the dish",
          "prepTime": 15,
          "cookTime": 30,
          "servings": 4,
          "difficulty": "easy",
          "ingredients": [
            "2 cups rice",
            "1 lb chicken breast",
            "1 onion, diced"
          ],
          "instructions": [
            "Heat oil in a large pan",
            "Add onions and cook until translucent",
            "Add chicken and cook until golden"
          ],
          "tips": [
            "Use fresh ingredients for best flavor",
            "Season to taste"
          ],
          "nutrition": {
            "calories": 350,
            "protein": 25,
            "carbs": 40,
            "fat": 12
          }
        }
      ]
      
      Requirements:
      - Use ONLY the provided ingredients (you can suggest common pantry staples like salt, pepper, oil if needed)
      - Make recipes practical and achievable
      - Include realistic cooking times
      - Provide clear, step-by-step instructions
      - Add helpful cooking tips
      - Include nutritional estimates per serving
      - Make recipes diverse (different cooking methods, cuisines, etc.)
      - Difficulty should be "easy", "medium", or "hard"
      - Respond with ONLY the JSON array, no additional text.
    `;

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response with proper error handling
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid response from AI model');
    }
    
    // Log the response for debugging
    console.log('Gemini API Response:', text);
    
    // Try to find JSON in the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('Could not parse recipe information from response. The AI may not have returned valid JSON format.');
    }
    
    try {
      const recipes = JSON.parse(jsonMatch[0]);
      return recipes;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw JSON string:', jsonMatch[0]);
      throw new Error('Failed to parse JSON response from AI model');
    }
  } catch (error) {
    console.error('Error generating recipes:', error);
    throw new Error('Failed to generate recipes. Please try again.');
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data:image/jpeg;base64, prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};