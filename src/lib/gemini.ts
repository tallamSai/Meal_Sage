import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable for Gemini API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Note: In production, store API keys securely using environment variables
const genAI = new GoogleGenerativeAI(API_KEY);

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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert file to base64
    const imageBase64 = await fileToBase64(imageFile);
    
    const prompt = `
      Analyze this food image and provide detailed nutritional information. 
      Identify the food item(s) and estimate nutritional values per serving.
      
      Respond in this exact JSON format:
      {
        "foodItem": "name of the food",
        "confidence": number from 0 to 1 of how confident you are in the nutrition information,
        "nutrition": {
          "calories": 250,
          "protein": estimated protein in grams,
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
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse nutritional information from response');
    }
    
    const nutritionData = JSON.parse(jsonMatch[0]);
    return nutritionData;
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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent([prompt]);
  const response = await result.response;
  const text = response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse health rating from AI');
  return JSON.parse(jsonMatch[0]);
}

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