import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Award, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollReveal from '@/components/ScrollReveal';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { geminiHealthyAlternative, geminiRatePackagedFood } from '@/lib/gemini';
import { fetchRecipeWithFallback } from '@/lib/edamam';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import ScrollStack, { ScrollStackItem } from '../../y/ScrollStack/ScrollStack';

const Results = () => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAlt, setShowAlt] = useState<{ [id: string]: boolean }>({});
  const [altLoading, setAltLoading] = useState<{ [id: string]: boolean }>({});
  const [altResult, setAltResult] = useState<{ [id: string]: any }>({});
  const [aiHealth, setAiHealth] = useState<{ [id: string]: { score: number, explanation: string } }>({});

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user);
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setAnalyses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'analyses'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Fetched analyses for user:', currentUser.uid, snapshot.docs.length);
      setAnalyses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error('Firestore onSnapshot error:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-16 flex items-center justify-center">
        <div className="text-center text-xl text-muted-foreground">Please sign in to view your results.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-16">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Your Nutrition Dashboard
            </h1>
            <p className="text-xl text-foreground max-w-2xl mx-auto">
              Track your nutrition journey and discover insights from your food analysis history
            </p>
          </div>
        </ScrollReveal>

        {/* Dashboard Summary */}
        {!loading && analyses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="border-0 glass shadow-glass">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-foreground mb-1">
                  {analyses.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Foods Analyzed
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 glass shadow-glass">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-foreground mb-1">
                  {(
                    analyses.reduce((sum, a) => sum + (a.healthScore || 0), 0) / analyses.length
                  ).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg Health Score
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 glass shadow-glass">
              <CardContent className="p-6 text-center">
                <Award className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-lg font-bold text-foreground mb-1 truncate">
                  {analyses[0]?.foodItem || '—'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Most Recent Food
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analyses List */}
        {loading ? (
          <div className="text-center text-lg text-muted-foreground py-20">Loading your results...</div>
        ) : analyses.length === 0 ? (
          <div className="text-center text-lg text-muted-foreground py-20">No analyses yet. Start analyzing food to see your results here.</div>
        ) : (
          <ScrollReveal>
            <ScrollStack>
              {analyses.map((analysis, index) => {
                const handleAltClick = async () => {
                  setShowAlt(prev => ({ ...prev, [analysis.id]: true }));
                  setAltLoading(prev => ({ ...prev, [analysis.id]: true }));
                  setAltResult(prev => ({ ...prev, [analysis.id]: null }));
                  try {
                    const recipes = await fetchRecipeWithFallback(analysis.foodItem);
                    if (recipes.length === 0) {
                      setAltResult(prev => ({ ...prev, [analysis.id]: { error: 'No healthy alternative found.' } }));
                    } else {
                      let alt;
                      let isOpenFoodFacts = false;
                      if (recipes[0].recipe) {
                        const recipe = recipes[0].recipe;
                        const servings = recipe.yield || 1;
                        alt = {
                          title: recipe.label,
                          nutritionFacts: `Calories: ${Math.round(recipe.calories / servings)}, Protein: ${Math.round((recipe.totalNutrients.PROCNT?.quantity || 0) / servings)}g, Carbs: ${Math.round((recipe.totalNutrients.CHOCDF?.quantity || 0) / servings)}g, Fat: ${Math.round((recipe.totalNutrients.FAT?.quantity || 0) / servings)}g (per serving)`,
                          description: recipe.ingredientLines.join(' '),
                          imageUrl: recipe.image,
                          url: recipe.url,
                        };
                      } else {
                        // Open Food Facts format
                        isOpenFoodFacts = true;
                        const p = recipes[0];
                        const n = p.nutriments || {};
                        alt = {
                          title: p.product_name || p.generic_name || 'Alternative',
                          nutritionFacts: `Calories: ${n['energy-kcal_100g'] || n['energy_100g'] || '?'}, Protein: ${n['proteins_100g'] || '?'}g, Carbs: ${n['carbohydrates_100g'] || '?'}g, Fat: ${n['fat_100g'] || '?'}g (per 100g)`,
                          description: p.ingredients_text || '',
                          imageUrl: p.image_url,
                          url: p.url || p.code ? `https://world.openfoodfacts.org/product/${p.code}` : undefined,
                          nutriments: n,
                        };
                      }
                      setAltResult(prev => ({ ...prev, [analysis.id]: alt }));
                      // If Open Food Facts, call Gemini for health score
                      if (isOpenFoodFacts) {
                        geminiRatePackagedFood(alt.nutriments, alt.title).then(ai => {
                          setAiHealth(prev => ({ ...prev, [analysis.id]: { score: ai.healthScore, explanation: ai.explanation } }));
                        }).catch(() => {
                          setAiHealth(prev => ({ ...prev, [analysis.id]: { score: 0, explanation: 'Could not determine health score.' } }));
                        });
                      }
                    }
                  } catch (e) {
                    setAltResult(prev => ({ ...prev, [analysis.id]: { error: 'Failed to generate alternative.' } }));
                  } finally {
                    setAltLoading(prev => ({ ...prev, [analysis.id]: false }));
                  }
                };
                return (
                  <ScrollStackItem key={analysis.id}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-2xl bg-card shadow-card p-6 flex flex-row items-start gap-8 w-full overflow-x-auto overflow-y-auto max-h-[70vh]"
                    >
                      {analysis.imageUrl && (
                        <img src={analysis.imageUrl} alt={analysis.foodItem} className="w-32 h-32 object-cover rounded-xl border border-border shadow-md flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground text-2xl mb-2">{analysis.foodItem}</h3>
                        <div className="text-muted-foreground text-sm mb-2">Confidence: {Math.round((analysis.confidence || 0) * 100)}%</div>
                        <div className="flex flex-wrap gap-4 mb-2">
                          <span className="font-medium">Calories: <span className="text-primary">{analysis.nutrition?.calories}</span></span>
                          <span className="font-medium">Protein: <span className="text-primary">{analysis.nutrition?.protein}g</span></span>
                          <span className="font-medium">Carbs: <span className="text-primary">{analysis.nutrition?.carbs}g</span></span>
                          <span className="font-medium">Fat: <span className="text-primary">{analysis.nutrition?.fat}g</span></span>
                          <span className="font-medium">Fiber: <span className="text-primary">{analysis.nutrition?.fiber}g</span></span>
                          <span className="font-medium">Sugar: <span className="text-primary">{analysis.nutrition?.sugar}g</span></span>
                          <span className="font-medium">Sodium: <span className="text-primary">{analysis.nutrition?.sodium}mg</span></span>
                        </div>
                        <div className="font-medium mb-2">Health Score: <span className="text-primary">{analysis.healthScore}/10</span></div>
                        <div>
                          <span className="font-semibold">Recommendations:</span>
                          <ul className="list-disc list-inside text-muted-foreground mt-1">
                            {Array.isArray(analysis.recommendations) && analysis.recommendations.map((rec: string, i: number) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                        <button
                          className="mt-4 bg-primary text-primary-foreground rounded-lg px-4 py-2 font-semibold hover:bg-primary/90 transition shadow"
                          onClick={handleAltClick}
                          disabled={altLoading[analysis.id]}
                        >
                          {altLoading[analysis.id] ? 'Generating...' : 'Give me a healthy alternative meal prep'}
                        </button>
                        {showAlt[analysis.id] && (
                          <div className="mt-6 p-4 rounded-xl bg-background border border-border shadow-inner">
                            {altLoading[analysis.id] && <div className="text-muted-foreground">Generating alternative...</div>}
                            {altResult[analysis.id] && altResult[analysis.id].error && <div className="text-red-500">{altResult[analysis.id].error}</div>}
                            {altResult[analysis.id] && !altResult[analysis.id].error && (
                              <>
                                <h4 className="font-bold text-lg mb-2">
                                  {altResult[analysis.id].url && altResult[analysis.id].url.includes('openfoodfacts')
                                    ? 'Packaged Product Nutrition Info'
                                    : `Healthy Alternative: ${altResult[analysis.id].title}`}
                                </h4>
                                {altResult[analysis.id].url && altResult[analysis.id].url.includes('openfoodfacts') && aiHealth[analysis.id] && (
                                  <div className="mb-2">
                                    <div className="font-bold">AI Health Score: {aiHealth[analysis.id].score}/10</div>
                                    <div className="text-muted-foreground">{aiHealth[analysis.id].explanation}</div>
                                  </div>
                                )}
                                <div className="mb-2 text-sm text-muted-foreground">{altResult[analysis.id].nutritionFacts}</div>
                                <div className="mb-2">{altResult[analysis.id].description}</div>
                                {altResult[analysis.id].imageUrl && (
                                  <img src={altResult[analysis.id].imageUrl} alt={altResult[analysis.id].title} className="w-40 h-40 object-cover rounded-lg border border-border mb-2" />
                                )}
                                <a href={altResult[analysis.id].url} target="_blank" rel="noopener noreferrer" className="text-primary underline">View Full Product</a>
                              </>
                            )}
                          </div>
                        )}
                        {/* Delete Button */}
                        <button
                          className="mt-4 ml-4 bg-destructive text-white rounded-lg px-4 py-2 font-semibold hover:bg-destructive/90 transition shadow"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this analysis?')) {
                              // Delete Firestore doc
                              await deleteDoc(doc(collection(db, 'analyses'), analysis.id));
                              // Delete image from Storage if present
                              if (analysis.imageUrl) {
                                try {
                                  const imagePath = decodeURIComponent(new URL(analysis.imageUrl).pathname.replace(/^\/v0\/b\/[^/]+\/o\//, '').replace(/\?.*$/, ''));
                                  const imgRef = storageRef(storage, imagePath);
                                  await deleteObject(imgRef);
                                } catch (e) {
                                  // Ignore image delete errors
                                }
                              }
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <div className="text-xs text-muted-foreground">{analysis.createdAt?.toDate ? analysis.createdAt.toDate().toLocaleString() : ''}</div>
                      </div>
                    </motion.div>
                  </ScrollStackItem>
                );
              })}
            </ScrollStack>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
};

export default Results;