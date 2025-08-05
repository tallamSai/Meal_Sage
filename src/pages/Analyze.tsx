import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, Loader2, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { analyzeFood, NutritionalInfo } from '@/lib/gemini';
import ScrollReveal from '@/components/ScrollReveal';
import { db, auth, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import VariableProximity from '@/components/VariableProximity';

const Analyze = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NutritionalInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
        setAnalysisResult(null);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file (JPG, PNG, etc.)',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    if (!currentUser) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to analyze and save your food data.',
        variant: 'destructive',
      });
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeFood(selectedFile);
      setAnalysisResult(result);
      toast({
        title: 'Analysis Complete!',
        description: `Successfully analyzed ${result.foodItem}`,
      });
      // Save to Firestore if user is logged in
      if (currentUser && selectedFile) {
        // Upload image to Firebase Storage
        const imageRef = ref(storage, `user_uploads/${currentUser.uid}/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(imageRef, selectedFile);
        const imageUrl = await getDownloadURL(imageRef);
        const docData = {
          uid: currentUser.uid,
          ...result,
          imageUrl,
          createdAt: serverTimestamp(),
          createdAtClient: new Date().toISOString(),
        };
        console.log('Saving analysis to Firestore for user:', currentUser.uid, docData);
        await addDoc(collection(db, 'analyses'), docData);
      }
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getNutritionColor = (value: number, type: string) => {
    switch (type) {
      case 'protein':
        return value > 15 ? 'text-primary-green' : value > 8 ? 'text-primary-orange' : 'text-destructive';
      case 'fiber':
        return value > 5 ? 'text-primary-green' : value > 2 ? 'text-primary-orange' : 'text-destructive';
      case 'sugar':
        return value < 10 ? 'text-primary-green' : value < 20 ? 'text-primary-orange' : 'text-destructive';
      case 'sodium':
        return value < 300 ? 'text-primary-green' : value < 600 ? 'text-primary-orange' : 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 8) return 'text-primary-green';
    if (score >= 6) return 'text-primary-orange';
    return 'text-destructive';
  };

  const analyzeRef = useRef<HTMLDivElement>(null);
  return (
    <div className="min-h-screen bg-background pt-32 pb-16">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-12" ref={analyzeRef}>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              <VariableProximity
                label="Analyze Your Food"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={analyzeRef}
                radius={100}
                className="inline-block"
              />
            </h1>
            <p className="text-xl text-foreground max-w-2xl mx-auto">
              <VariableProximity
                label="Upload a photo of your food and get instant nutritional insights powered by AI"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={analyzeRef}
                radius={100}
                className="inline-block"
              />
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <ScrollReveal direction="left">
              <Card className="border-0 glass shadow-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Camera className="w-6 h-6" />
                    Upload Food Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!preview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-2xl p-16 text-center cursor-pointer hover:border-primary bg-background hover:bg-background/80 transition-all duration-300 group hover-lift"
                    >
                      <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-6 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                      <p className="text-xl font-semibold text-foreground mb-3">
                        Click to upload an image
                      </p>
                      <p className="text-foreground text-lg">
                        Supports JPG, PNG, WebP
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={preview}
                          alt="Food preview"
                          className="w-full h-72 object-cover rounded-2xl shadow-elegant"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={clearSelection}
                          className="absolute top-2 right-2 w-8 h-8"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !currentUser}
                        className="w-full"
                        size="lg"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Analyze Food
                          </>
                        )}
                      </Button>
                      {!currentUser && (
                        <div className="text-red-500 text-center mt-2">Please sign in to analyze and save your food data.</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Results Section */}
            <ScrollReveal direction="right">
              <Card className="border-0 glass shadow-glass">
                <CardHeader>
                  <CardTitle className="text-foreground">Nutritional Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {!analysisResult ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Upload and analyze an image to see results</p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Food Info */}
                      <div className="text-center pb-4 border-b border-border">
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          {analysisResult.foodItem}
                        </h3>
                        <div className="flex items-center justify-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            Confidence: {Math.round(analysisResult.confidence * 100)}%
                          </span>
                          <span className={`text-sm font-medium ${getHealthScoreColor(analysisResult.healthScore)}`}>
                            Health Score: {analysisResult.healthScore}/10
                          </span>
                        </div>
                      </div>

                      {/* Nutrition Grid */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="glass-card rounded-2xl p-6 text-center hover-lift">
                          <div className="text-2xl font-bold text-foreground">
                            {analysisResult.nutrition.calories}
                          </div>
                          <div className="text-sm text-muted-foreground">Calories</div>
                        </div>
                        
                        <div className="glass-card rounded-2xl p-6 text-center hover-lift">
                          <div className={`text-3xl font-bold ${getNutritionColor(analysisResult.nutrition.protein, 'protein')}`}>
                            {analysisResult.nutrition.protein}g
                          </div>
                          <div className="text-sm text-muted-foreground font-medium">Protein</div>
                        </div>
                        
                        <div className="glass-card rounded-2xl p-6 text-center hover-lift">
                          <div className="text-3xl font-bold text-foreground">
                            {analysisResult.nutrition.carbs}g
                          </div>
                          <div className="text-sm text-muted-foreground font-medium">Carbs</div>
                        </div>
                        
                        <div className="glass-card rounded-2xl p-6 text-center hover-lift">
                          <div className="text-3xl font-bold text-foreground">
                            {analysisResult.nutrition.fat}g
                          </div>
                          <div className="text-sm text-muted-foreground font-medium">Fat</div>
                        </div>
                        
                        <div className="glass-card rounded-2xl p-6 text-center hover-lift">
                          <div className={`text-3xl font-bold ${getNutritionColor(analysisResult.nutrition.fiber, 'fiber')}`}>
                            {analysisResult.nutrition.fiber}g
                          </div>
                          <div className="text-sm text-muted-foreground font-medium">Fiber</div>
                        </div>
                        
                        <div className="glass-card rounded-2xl p-6 text-center hover-lift">
                          <div className={`text-3xl font-bold ${getNutritionColor(analysisResult.nutrition.sugar, 'sugar')}`}>
                            {analysisResult.nutrition.sugar}g
                          </div>
                          <div className="text-sm text-muted-foreground font-medium">Sugar</div>
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Health Recommendations</h4>
                        <ul className="space-y-2">
                          {analysisResult.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-primary-green mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analyze;