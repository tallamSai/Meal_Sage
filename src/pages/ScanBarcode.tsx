import { useState } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { geminiRatePackagedFood } from '@/lib/gemini';

const ScanBarcode = () => {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [aiHealth, setAiHealth] = useState<{ score: number, explanation: string } | null>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);

  const fetchProduct = async (code: string) => {
    setError('');
    setProduct(null);
    setAiHealth(null);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1) {
        setProduct(data.product);
        if (data.product.nutriments) {
          try {
            const ai = await geminiRatePackagedFood(data.product.nutriments, data.product.product_name || 'Product');
            setAiHealth({ score: ai.healthScore, explanation: ai.explanation });
          } catch {
            setAiHealth({ score: 0, explanation: 'Could not determine health score.' });
          }
        }
      } else {
        setError('Product not found in Open Food Facts.');
      }
    } catch (e) {
      setError('Failed to fetch product info.');
    }
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-16">
      <div className="container mx-auto px-4 max-w-xl">
        <Card className="border-0 glass shadow-glass">
          <CardHeader>
            <CardTitle className="text-foreground">Scan Barcode</CardTitle>
          </CardHeader>
          <CardContent>
            {scanning && (
              <BarcodeScannerComponent
                width={400}
                height={200}
                onUpdate={(err, result) => {
                  const code = result && typeof result.getText === 'function' ? result.getText() : undefined;
                  if (code) {
                    setBarcode(code);
                    setScanning(false);
                    fetchProduct(code);
                  }
                }}
              />
            )}
            {!scanning && (
              <button className="mb-4 px-4 py-2 bg-primary text-white rounded" onClick={() => { setScanning(true); setBarcode(''); setProduct(null); setAiHealth(null); setError(''); }}>
                Scan Another
              </button>
            )}
            {barcode && <div className="mb-2">Scanned Barcode: <span className="font-mono">{barcode}</span></div>}
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {product && (
              <div className="mt-4">
                <div className="font-bold text-lg mb-2">{product.product_name || 'Product'}</div>
                {aiHealth && (
                  <div className="mb-2">
                    <div className="font-bold">AI Health Score: {aiHealth.score}/10</div>
                    <div className="text-muted-foreground">{aiHealth.explanation}</div>
                  </div>
                )}
                <div className="mb-2 text-sm text-muted-foreground">
                  Calories: {product.nutriments?.['energy-kcal_100g'] || product.nutriments?.['energy_100g'] || '?'} kcal/100g<br />
                  Protein: {product.nutriments?.['proteins_100g'] || '?'}g<br />
                  Carbs: {product.nutriments?.['carbohydrates_100g'] || '?'}g<br />
                  Fat: {product.nutriments?.['fat_100g'] || '?'}g<br />
                  Fiber: {product.nutriments?.['fiber_100g'] || '?'}g<br />
                  Sugar: {product.nutriments?.['sugars_100g'] || '?'}g<br />
                  Sodium: {product.nutriments?.['sodium_100g'] || '?'}mg
                </div>
                {product.image_url && (
                  <img src={product.image_url} alt={product.product_name} className="w-40 h-40 object-cover rounded-lg border border-border mb-2" />
                )}
                <a href={`https://world.openfoodfacts.org/product/${product.code}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">View Full Product</a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScanBarcode;
 