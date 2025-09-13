import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, Loader2, Info, Clipboard } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const storeKeywords = {
  tesco: "Tesco",
  asda: "ASDA",
  sainsburys: "Sainsbury's",
  morrisons: "Morrisons",
  aldi: "Aldi",
  lidl: "Lidl",
  waitrose: "Waitrose",
  iceland: "Iceland",
  coop: "Co-op",
  ocado: "Ocado"
};

export default function SmartListInput({ onCompare, loading }) {
  const [listText, setListText] = useState('');
  const [detectedSource, setDetectedSource] = useState(null);
  const textareaRef = useRef(null);

  const detectSource = (text) => {
    const lowerText = text.toLowerCase();
    for (const keyword in storeKeywords) {
      if (lowerText.includes(keyword)) {
        return storeKeywords[keyword];
      }
    }
    return null;
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setListText(text);
    setDetectedSource(detectSource(text));
  };
  
  const handlePaste = async () => {
    try {
        const text = await navigator.clipboard.readText();
        setListText(text);
        setDetectedSource(detectSource(text));
        textareaRef.current?.focus();
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleSubmit = () => {
    if (loading || !listText.trim()) return;

    // FIX: Relax validation on the component side. The parent page will now handle it.
    onCompare(listText, detectedSource);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={listText}
          onChange={handleTextChange}
          placeholder="e.g.&#10;Milk 2L&#10;Bread&#10;Eggs 12 pack&#10;Bells Whisky"
          className="min-h-[150px] p-4 pr-12 text-base border-gray-300 focus:border-teal-500 focus:ring-teal-500"
          disabled={loading}
        />
        <Button 
            variant="ghost" 
            size="icon"
            onClick={handlePaste}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            title="Paste from clipboard"
            disabled={loading}
        >
            <Clipboard className="w-5 h-5"/>
        </Button>
      </div>

      <AnimatePresence>
        {detectedSource && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-700" />
              <AlertDescription className="text-blue-800">
                We've detected this might be a list from <strong>{detectedSource}</strong>. We'll use this to improve your comparison.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Button onClick={handleSubmit} disabled={loading || !listText.trim()} className="w-full bg-teal-600 hover:bg-teal-700 h-12 text-lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Comparing...
          </>
        ) : (
          <>
            <BarChart3 className="mr-2 h-5 w-5" />
            Start Comparison
          </>
        )}
      </Button>
    </div>
  );
}