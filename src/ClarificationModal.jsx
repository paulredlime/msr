import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, HelpCircle } from 'lucide-react';

const clarificationMap = {
    'milk': { options: ['1 litre', '2 litres', '500ml', '1 pint', '2 pints', '4 pints'], default: '2 pints' },
    'eggs': { options: ['6 pack', '10 pack', '12 pack', '15 pack'], default: '6 pack' },
    'bread': { options: ['white sliced', 'wholemeal sliced', 'sourdough loaf', 'brown sliced'], default: 'white sliced' },
    'butter': { options: ['250g', '500g'], default: '250g' },
    'cheese': { options: ['cheddar 250g', 'cheddar 500g', 'red leicester', 'mozzarella'], default: 'cheddar 250g' },
    'sausages': { options: ['6 pack', '8 pack', '12 pack'], default: '6 pack' },
    'chicken': { options: ['breast fillets 500g', 'whole chicken', 'thighs 1kg'], default: 'breast fillets 500g' },
    'potatoes': { options: ['2.5kg bag', 'baking potatoes 4 pack'], default: '2.5kg bag' },
    'onions': { options: ['3 pack', '1kg bag'], default: '3 pack' }
};

export default function ClarificationModal({ isOpen, onClose, ambiguousItems, originalList, onComplete }) {
  const [selections, setSelections] = useState({});

  useEffect(() => {
    if (isOpen) {
      const initialSelections = {};
      ambiguousItems.forEach(item => {
        initialSelections[item.term] = clarificationMap[item.term]?.default || clarificationMap[item.term]?.options[0];
      });
      setSelections(initialSelections);
    }
  }, [isOpen, ambiguousItems]);

  const handleSelect = (term, option) => {
    setSelections(prev => ({ ...prev, [term]: option }));
  };

  const handleContinue = () => {
    let updatedList = originalList;
    Object.entries(selections).forEach(([term, selection]) => {
      // Use a regex that matches the whole word to avoid replacing parts of other words
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      updatedList = updatedList.replace(regex, `${term} ${selection}`);
    });
    onComplete(updatedList);
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Just to clarify...
          </DialogTitle>
          <DialogDescription>
            Help us find the right products by selecting the correct size or type for these items.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {ambiguousItems.map(({ term, line }) => (
            <div key={term} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">For the item:</p>
              <p className="font-semibold text-gray-800 mb-3">"{line}"</p>
              <div className="flex flex-wrap gap-2">
                {clarificationMap[term]?.options.map(option => (
                  <Button
                    key={option}
                    variant={selections[term] === option ? 'default' : 'outline'}
                    onClick={() => handleSelect(term, option)}
                    className="transition-all"
                  >
                    {selections[term] === option && <Check className="w-4 h-4 mr-2" />}
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleContinue}>Continue to Comparison</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}