import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Utensils, Loader2, Link, ShoppingCart } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';
import { ShoppingList } from '@/api/entities';
import { toast } from 'sonner';

export default function Recipes() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!url) {
      setError('Please enter a recipe URL.');
      return;
    }
    setLoading(true);
    setRecipe(null);
    setError('');

    try {
      const prompt = `From the URL "${url}", extract the recipe name and ingredients. Return ONLY a JSON object with this structure: {"recipe_name": "...", "ingredients": [{"name": "...", "quantity": "..."}]}. Do not include any text before or after the JSON object.`;
      
      const response = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            recipe_name: { type: "string" },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" }
                },
                required: ["name", "quantity"]
              }
            }
          },
          required: ["recipe_name", "ingredients"]
        }
      });
      
      setRecipe(response);

    } catch (e) {
      console.error(e);
      setError('Failed to import recipe. Please check the URL and try again.');
      toast.error('Failed to import recipe.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async () => {
    if (!recipe || !recipe.ingredients) return;
    
    try {
      const newList = await ShoppingList.create({
        name: recipe.recipe_name || 'Imported Recipe',
        original_text: recipe.ingredients.map(i => `${i.quantity} ${i.name}`).join('\n'),
        items: recipe.ingredients.map(i => ({ name: i.name, quantity: i.quantity, category: 'Uncategorized' })),
        status: 'draft'
      });
      toast.success(`Successfully created "${newList.name}" shopping list!`);
      setRecipe(null);
      setUrl('');
    } catch (error) {
      console.error('Failed to create shopping list:', error);
      toast.error('Could not save ingredients to a new list.');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Recipe Importer</h1>
          <p className="text-lg text-gray-600">Paste a recipe URL to instantly create a shopping list.</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="url"
                placeholder="https://www.bbcgoodfood.com/recipes/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-grow"
                disabled={loading}
              />
              <Button onClick={handleImport} disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Import Recipe
                  </>
                )}
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </CardContent>
        </Card>

        {recipe && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-teal-600" />
                {recipe.recipe_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-2">Ingredients:</h3>
              <ul className="list-disc list-inside space-y-2 bg-gray-50 p-4 rounded-md">
                {recipe.ingredients.map((item, index) => (
                  <li key={index}>
                    <span className="font-medium">{item.name}</span> - <span className="text-gray-600">{item.quantity}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={handleAddToList} className="mt-6 w-full">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to a New Shopping List
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}