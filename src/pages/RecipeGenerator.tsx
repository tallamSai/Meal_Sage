import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Plus, X, Loader2, Sparkles, Clock, Users, Star, History, Calendar, UserCircle, Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { generateRecipes } from '@/lib/gemini';
import ScrollReveal from '@/components/ScrollReveal';
import { db, auth } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import VariableProximity from '@/components/VariableProximity';

interface Recipe {
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

interface StoredRecipeGeneration {
  id: string;
  uid: string;
  ingredients: string[];
  recipes: Recipe[];
  createdAt: any;
  createdAtClient: string;
}

interface FavoriteRecipe {
  id: string;
  uid: string;
  recipe: Recipe;
  originalGenerationId: string;
  createdAt: any;
  createdAtClient: string;
}

const RecipeGenerator = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [storedGenerations, setStoredGenerations] = useState<StoredRecipeGeneration[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<FavoriteRecipe[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const { toast } = useToast();

  const ingredientInputRef = useRef<HTMLInputElement>(null);
  const recipeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchStoredRecipes = async () => {
    if (!currentUser) return;
    
    setIsLoadingHistory(true);
    try {
      // First get all documents for the user
      const q = query(
        collection(db, 'recipe_generations'),
        where('uid', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const generations: StoredRecipeGeneration[] = [];
      
      querySnapshot.forEach((doc) => {
        generations.push({
          id: doc.id,
          ...doc.data()
        } as StoredRecipeGeneration);
      });
      
      // Sort by createdAtClient (client-side sorting to avoid index requirement)
      generations.sort((a, b) => {
        const dateA = new Date(a.createdAtClient).getTime();
        const dateB = new Date(b.createdAtClient).getTime();
        return dateB - dateA; // Most recent first
      });
      
      setStoredGenerations(generations);
    } catch (error) {
      console.error('Error fetching stored recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipe history',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchFavoriteRecipes = async () => {
    if (!currentUser) return;
    
    setIsLoadingFavorites(true);
    try {
      const q = query(
        collection(db, 'favorite_recipes'),
        where('uid', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const favorites: FavoriteRecipe[] = [];
      
      querySnapshot.forEach((doc) => {
        favorites.push({
          id: doc.id,
          ...doc.data()
        } as FavoriteRecipe);
      });
      
      // Sort by creation date (most recent first)
      favorites.sort((a, b) => {
        const dateA = new Date(a.createdAtClient).getTime();
        const dateB = new Date(b.createdAtClient).getTime();
        return dateB - dateA;
      });
      
      setFavoriteRecipes(favorites);
    } catch (error) {
      console.error('Error fetching favorite recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load favorite recipes',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const addToFavorites = async (recipe: Recipe, generationId: string) => {
    if (!currentUser) return;
    
    try {
      const docData = {
        uid: currentUser.uid,
        recipe,
        originalGenerationId: generationId,
        createdAt: serverTimestamp(),
        createdAtClient: new Date().toISOString(),
      };
      
      await addDoc(collection(db, 'favorite_recipes'), docData);
      
      toast({
        title: 'Added to Favorites!',
        description: `${recipe.title} has been saved to your favorites`,
      });
      
      // Refresh favorites list
      await fetchFavoriteRecipes();
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to add recipe to favorites',
        variant: 'destructive',
      });
    }
  };

  const removeFromFavorites = async (favoriteId: string) => {
    try {
      await deleteDoc(doc(db, 'favorite_recipes', favoriteId));
      
      toast({
        title: 'Removed from Favorites',
        description: 'Recipe has been removed from your favorites',
      });
      
      // Refresh favorites list
      await fetchFavoriteRecipes();
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove recipe from favorites',
        variant: 'destructive',
      });
    }
  };

  const deleteGeneration = async (generationId: string) => {
    try {
      await deleteDoc(doc(db, 'recipe_generations', generationId));
      
      toast({
        title: 'Deleted',
        description: 'Recipe generation has been deleted',
      });
      
      // Refresh history list
      await fetchStoredRecipes();
    } catch (error) {
      console.error('Error deleting generation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete recipe generation',
        variant: 'destructive',
      });
    }
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim().toLowerCase())) {
      setIngredients([...ingredients, newIngredient.trim().toLowerCase()]);
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(ing => ing !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddIngredient();
    }
  };

  const handleGenerateRecipes = async () => {
    if (ingredients.length === 0) {
      toast({
        title: 'No ingredients',
        description: 'Please add at least one ingredient to generate recipes.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to generate and save recipes.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const generatedRecipes = await generateRecipes(ingredients);
      setRecipes(generatedRecipes);
      toast({
        title: 'Recipes Generated!',
        description: `Successfully generated ${generatedRecipes.length} recipe(s)`,
      });

      // Save to Firestore
      if (currentUser) {
        const docData = {
          uid: currentUser.uid,
          ingredients,
          recipes: generatedRecipes,
          createdAt: serverTimestamp(),
          createdAtClient: new Date().toISOString(),
        };
        await addDoc(collection(db, 'recipe_generations'), docData);
        
        // Refresh the stored recipes list
        await fetchStoredRecipes();
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    setIngredients([]);
    setRecipes([]);
    setNewIngredient('');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 md:pt-32 pb-8 md:pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-8 md:mb-12" ref={recipeRef}>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6 px-4">
              <VariableProximity
                label="Recipe Generator"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={recipeRef}
                radius={100}
                className="inline-block"
              />
            </h1>
            <p className="text-lg md:text-xl text-foreground max-w-2xl mx-auto px-4">
              <VariableProximity
                label="Enter your available ingredients and let AI create amazing recipes just for you"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={recipeRef}
                radius={100}
                className="inline-block"
              />
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate New
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2" onClick={fetchStoredRecipes}>
                <History className="w-4 h-4" />
                My Recipes
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-2" onClick={fetchFavoriteRecipes}>
                <Heart className="w-4 h-4" />
                Favorites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Ingredients Input Section */}
                <ScrollReveal direction="left">
                  <Card className="border-0 glass shadow-glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground text-lg md:text-xl">
                        <ChefHat className="w-5 h-5 md:w-6 md:h-6" />
                        Your Ingredients
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 md:space-y-6">
                      {/* Ingredient Input */}
                      <div className="flex gap-2">
                        <Input
                          ref={ingredientInputRef}
                          value={newIngredient}
                          onChange={(e) => setNewIngredient(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Add an ingredient (e.g., chicken, rice, tomatoes)"
                          className="flex-1"
                        />
                        <Button
                          onClick={handleAddIngredient}
                          disabled={!newIngredient.trim()}
                          size="icon"
                          className="shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Ingredients List */}
                      {ingredients.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">Added Ingredients:</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearAll}
                              className="text-destructive hover:text-destructive"
                            >
                              Clear All
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {ingredients.map((ingredient, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1 px-3 py-1"
                              >
                                {ingredient}
                                <button
                                  onClick={() => handleRemoveIngredient(ingredient)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Generate Button */}
                      <Button
                        onClick={handleGenerateRecipes}
                        disabled={isGenerating || ingredients.length === 0 || !currentUser}
                        className="w-full"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating Recipes...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Generate Recipes
                          </>
                        )}
                      </Button>
                      {!currentUser && (
                        <div className="text-red-500 text-center mt-2 text-sm md:text-base">
                          Please sign in to generate and save recipes.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </ScrollReveal>

                {/* Recipes Results Section */}
                <ScrollReveal direction="right">
                  <Card className="border-0 glass shadow-glass">
                    <CardHeader>
                      <CardTitle className="text-foreground text-lg md:text-xl">Generated Recipes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recipes.length === 0 ? (
                        <div className="text-center py-8 md:py-12 text-muted-foreground">
                          <ChefHat className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-base md:text-lg">Add ingredients and generate recipes to see results</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {recipes.map((recipe, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="glass-card rounded-2xl p-4 md:p-6 hover-lift"
                            >
                              {/* Recipe Header */}
                              <div className="mb-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="text-xl md:text-2xl font-bold text-foreground">
                                    {recipe.title}
                                  </h3>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addToFavorites(recipe, 'current-generation')}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Heart className="w-4 h-4" />
                                  </Button>
                                </div>
                                <p className="text-muted-foreground text-sm md:text-base mb-3">
                                  {recipe.description}
                                </p>
                                
                                {/* Recipe Meta */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {recipe.prepTime + recipe.cookTime} min
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {recipe.servings} servings
                                  </Badge>
                                  <Badge className={getDifficultyColor(recipe.difficulty)}>
                                    {recipe.difficulty}
                                  </Badge>
                                </div>
                              </div>

                              {/* Ingredients */}
                              <div className="mb-4">
                                <h4 className="font-semibold text-foreground mb-2">Ingredients:</h4>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                                  {recipe.ingredients.map((ingredient, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                      <Star className="w-3 h-3 text-primary" />
                                      {ingredient}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Instructions */}
                              <div className="mb-4">
                                <h4 className="font-semibold text-foreground mb-2">Instructions:</h4>
                                <ol className="space-y-2 text-sm text-muted-foreground">
                                  {recipe.instructions.map((instruction, idx) => (
                                    <li key={idx} className="flex gap-2">
                                      <span className="font-semibold text-primary min-w-[20px]">{idx + 1}.</span>
                                      {instruction}
                                    </li>
                                  ))}
                                </ol>
                              </div>

                              {/* Nutrition Info */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-foreground">{recipe.nutrition.calories}</div>
                                  <div className="text-xs text-muted-foreground">Calories</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-foreground">{recipe.nutrition.protein}g</div>
                                  <div className="text-xs text-muted-foreground">Protein</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-foreground">{recipe.nutrition.carbs}g</div>
                                  <div className="text-xs text-muted-foreground">Carbs</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-foreground">{recipe.nutrition.fat}g</div>
                                  <div className="text-xs text-muted-foreground">Fat</div>
                                </div>
                              </div>

                              {/* Tips */}
                              {recipe.tips.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-foreground mb-2">Tips:</h4>
                                  <ul className="space-y-1 text-sm text-muted-foreground">
                                    {recipe.tips.map((tip, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <Sparkles className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                        {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {!currentUser ? (
                <Card className="border-0 glass shadow-glass">
                  <CardContent className="text-center py-12">
                    <UserCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Sign in required</h3>
                    <p className="text-muted-foreground">Please sign in to view your recipe history.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 glass shadow-glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground text-lg md:text-xl">
                      <History className="w-5 h-5 md:w-6 md:h-6" />
                      Your Recipe History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistory ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                        <p className="text-muted-foreground">Loading your recipes...</p>
                      </div>
                    ) : storedGenerations.length === 0 ? (
                      <div className="text-center py-8 md:py-12 text-muted-foreground">
                        <History className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-base md:text-lg">No recipes generated yet</p>
                        <p className="text-sm mt-2">Generate some recipes to see them here!</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {storedGenerations.map((generation, genIndex) => (
                          <motion.div
                            key={generation.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: genIndex * 0.1 }}
                            className="glass-card rounded-2xl p-4 md:p-6 hover-lift"
                          >
                            {/* Generation Header */}
                            <div className="mb-4 pb-4 border-b border-border">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-foreground">
                                  Generated on {new Date(generation.createdAtClient).toLocaleDateString()}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(generation.createdAtClient).toLocaleTimeString()}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteGeneration(generation.id)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <span className="text-sm text-muted-foreground">Ingredients used:</span>
                                {generation.ingredients.map((ingredient, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {ingredient}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Recipes in this generation */}
                            <div className="space-y-4">
                              {generation.recipes.map((recipe, recipeIndex) => (
                                <div key={recipeIndex} className="border border-border rounded-xl p-4">
                                  <div className="mb-3">
                                    <div className="flex items-start justify-between mb-1">
                                      <h4 className="text-lg font-bold text-foreground">
                                        {recipe.title}
                                      </h4>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addToFavorites(recipe, generation.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                      >
                                        <Heart className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {recipe.description}
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                        <Clock className="w-3 h-3" />
                                        {recipe.prepTime + recipe.cookTime} min
                                      </Badge>
                                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                        <Users className="w-3 h-3" />
                                        {recipe.servings} servings
                                      </Badge>
                                      <Badge className={`${getDifficultyColor(recipe.difficulty)} text-xs`}>
                                        {recipe.difficulty}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Quick nutrition info */}
                                  <div className="grid grid-cols-4 gap-2 text-center">
                                    <div>
                                      <div className="text-sm font-bold text-foreground">{recipe.nutrition.calories}</div>
                                      <div className="text-xs text-muted-foreground">Cal</div>
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-foreground">{recipe.nutrition.protein}g</div>
                                      <div className="text-xs text-muted-foreground">Protein</div>
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-foreground">{recipe.nutrition.carbs}g</div>
                                      <div className="text-xs text-muted-foreground">Carbs</div>
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-foreground">{recipe.nutrition.fat}g</div>
                                      <div className="text-xs text-muted-foreground">Fat</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              {!currentUser ? (
                <Card className="border-0 glass shadow-glass">
                  <CardContent className="text-center py-12">
                    <UserCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Sign in required</h3>
                    <p className="text-muted-foreground">Please sign in to view your favorite recipes.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 glass shadow-glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground text-lg md:text-xl">
                      <Heart className="w-5 h-5 md:w-6 md:h-6" />
                      Your Favorite Recipes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingFavorites ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                        <p className="text-muted-foreground">Loading your favorites...</p>
                      </div>
                    ) : favoriteRecipes.length === 0 ? (
                      <div className="text-center py-8 md:py-12 text-muted-foreground">
                        <Heart className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-base md:text-lg">No favorite recipes yet</p>
                        <p className="text-sm mt-2">Add recipes to your favorites by clicking the heart icon!</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {favoriteRecipes.map((favorite, index) => (
                          <motion.div
                            key={favorite.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card rounded-2xl p-4 md:p-6 hover-lift"
                          >
                            {/* Favorite Header */}
                            <div className="mb-4 pb-4 border-b border-border">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-foreground">
                                  Added to favorites on {new Date(favorite.createdAtClient).toLocaleDateString()}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(favorite.createdAtClient).toLocaleTimeString()}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFromFavorites(favorite.id)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Recipe Details */}
                            <div className="space-y-4">
                              <div className="border border-border rounded-xl p-4">
                                <div className="mb-3">
                                  <h4 className="text-lg font-bold text-foreground mb-1">
                                    {favorite.recipe.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {favorite.recipe.description}
                                  </p>
                                  
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                      <Clock className="w-3 h-3" />
                                      {favorite.recipe.prepTime + favorite.recipe.cookTime} min
                                    </Badge>
                                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                      <Users className="w-3 h-3" />
                                      {favorite.recipe.servings} servings
                                    </Badge>
                                    <Badge className={`${getDifficultyColor(favorite.recipe.difficulty)} text-xs`}>
                                      {favorite.recipe.difficulty}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Ingredients */}
                                <div className="mb-4">
                                  <h5 className="font-semibold text-foreground mb-2 text-sm">Ingredients:</h5>
                                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground">
                                    {favorite.recipe.ingredients.map((ingredient, idx) => (
                                      <li key={idx} className="flex items-center gap-2">
                                        <Star className="w-3 h-3 text-primary" />
                                        {ingredient}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Instructions */}
                                <div className="mb-4">
                                  <h5 className="font-semibold text-foreground mb-2 text-sm">Instructions:</h5>
                                  <ol className="space-y-1 text-xs text-muted-foreground">
                                    {favorite.recipe.instructions.map((instruction, idx) => (
                                      <li key={idx} className="flex gap-2">
                                        <span className="font-semibold text-primary min-w-[16px]">{idx + 1}.</span>
                                        {instruction}
                                      </li>
                                    ))}
                                  </ol>
                                </div>

                                {/* Nutrition Info */}
                                <div className="grid grid-cols-4 gap-2 text-center">
                                  <div>
                                    <div className="text-sm font-bold text-foreground">{favorite.recipe.nutrition.calories}</div>
                                    <div className="text-xs text-muted-foreground">Cal</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-foreground">{favorite.recipe.nutrition.protein}g</div>
                                    <div className="text-xs text-muted-foreground">Protein</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-foreground">{favorite.recipe.nutrition.carbs}g</div>
                                    <div className="text-xs text-muted-foreground">Carbs</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-foreground">{favorite.recipe.nutrition.fat}g</div>
                                    <div className="text-xs text-muted-foreground">Fat</div>
                                  </div>
                                </div>

                                {/* Tips */}
                                {favorite.recipe.tips.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="font-semibold text-foreground mb-2 text-sm">Tips:</h5>
                                    <ul className="space-y-1 text-xs text-muted-foreground">
                                      {favorite.recipe.tips.map((tip, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <Sparkles className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                          {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RecipeGenerator;
