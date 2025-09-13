
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from '@/api/entities';
import { VoiceCommand } from '@/api/entities';
import { ShoppingList } from '@/api/entities';
import { generateSpeech } from '@/api/functions';
import { InvokeLLM } from '@/api/integrations';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Mic,
  MicOff,
  Volume2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Zap
} from 'lucide-react';
import ListeningAnimation from '../components/ListeningAnimation';

export default function VoiceShopping() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isRecognitionAvailable, setIsRecognitionAvailable] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [supportedVoices, setSupportedVoices] = useState([]);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  // Fallback detector used by our interceptor
  const COUPON_ONLY_MSG = /i can help you with coupons and deals/i;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        
        if (currentUser.subscription_status === 'expired') {
          setError('Voice shopping is a premium feature. Please upgrade your subscription.');
          // Do not return here, as we still want to set up speech recognition
          // but the start listening button will be disabled
        }
      } catch (error) {
        setError('Please log in to use voice shopping features.');
      }
    };

    loadUser();
    loadVoices();
    setupSpeechRecognition();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadVoices = () => {
    const voices = speechSynthesis.getVoices();
    const englishVoices = voices.filter(voice => 
      voice.lang.startsWith('en-') && 
      (voice.name.includes('Journey') || voice.name.includes('Studio') || voice.name.includes('Google') || voice.name.includes('Microsoft'))
    );
    setSupportedVoices(englishVoices);
  };

  const setupSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      setIsRecognitionAvailable(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    setIsRecognitionAvailable(true); // Set to true if available

    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-GB';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      // Calls the new, patched processVoiceCommand
      processVoiceCommand(transcript);
    };

    recognitionRef.current.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
  };

  const speakResponse = async (text) => {
    if (!text) return;

    try {
      setIsPlaying(true);
      
      // Try cloud TTS first if available
      if (user?.preferred_voice) {
        try {
          const audioResponse = await generateSpeech({
            text: text,
            voice: user.preferred_voice
          });
          
          if (audioResponse.audioUrl) {
            const audio = new Audio(audioResponse.audioUrl);
            audio.onended = () => setIsPlaying(false);
            audio.onerror = () => {
              console.warn('Cloud TTS failed, falling back to browser TTS');
              fallbackToWebSpeech(text);
            };
            audioRef.current = audio;
            await audio.play();
            return;
          }
        } catch (error) {
          console.warn('Cloud TTS error, falling back to browser TTS:', error);
        }
      }

      // Fallback to browser speech synthesis
      fallbackToWebSpeech(text);

    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsPlaying(false);
    }
  };

  const fallbackToWebSpeech = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('GB') && voice.name.includes('Google')
    ) || voices.find(voice => voice.lang.includes('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechSynthesis.speak(utterance);
  };

  // NEW: Normalize a free-text product into a canonical name + size for UK retail
  const normalizeForRetail = (name) => {
    const q = (name || "").toLowerCase();
    // add 700ml if whisky has no size
    if (/\bwhisk(e?)y\b/.test(q) && !/\b(\d+(\.\d+)?\s?(ml|l|cl|g|kg|pack|x)\b)/i.test(q)) {
      return `${name} 700ml`;
    }
    return name;
  };

  // Create a quick temp list and open comparison screen
  const runComparisonForProduct = async (rawName) => {
    const product = normalizeForRetail(rawName || "");
    // Using LLM for more robust normalization as in original code
    const normSchema = {
      type: "object",
      properties: {
        canonical_name: { type: "string" },
        brand: { type: "string" },
        size: { type: "string", description: "e.g. 700ml, 1L, 750ml, 2L, 500g" },
        category: { type: "string" },
        notes: { type: "string" }
      }
    };
    const prompt = `
      Normalize this product for UK supermarket comparison: "${product}".
      - Return brand (if obvious) and a canonical_name that includes the product name.
      - Choose the most common retail size for the UK (avoid miniatures/travel sizes like 5cl/50ml; prefer 700ml for whisky).
      - DO NOT return multipacks or single-cans when user intent is a bottle unless explicitly stated.
      - Keep it generic if brand is unclear.
      Return JSON only (no explanations).
    `;
    let normalized;
    try {
      normalized = await InvokeLLM({
        prompt,
        response_json_schema: normSchema
      });
    } catch (e) {
      console.error("Error normalizing product with LLM, falling back:", e);
      normalized = { canonical_name: product };
    }

    const displayName = [normalized?.brand, normalized?.canonical_name]
      .filter(Boolean)
      .join(' ') || product;
    const size = normalized?.size ? ` ${normalized.size}` : '';

    const announce = `Got it. Comparing prices for ${displayName}${size} across all stores now.`;
    setResponse(announce);
    await speakResponse(announce);

    // Create a temporary shopping list with the normalized product
    const tempList = await ShoppingList.create({
      name: `Voice Search: ${displayName}${size}`.slice(0, 60),
      original_text: `${displayName}${size}`,
      items: [{
        name: `${displayName}${size}`.trim(),
        quantity: "1x",
        category: normalized?.category || "general"
      }],
      status: "comparing",
      last_comparison_date: new Date().toISOString().split('T')[0]
    });
    setTimeout(() => {
      navigate(`${createPageUrl('ComparisonResults')}?listId=${tempList.id}&product=${encodeURIComponent(`${displayName}${size}`)}`);
    }, 400);
    return true;
  };

  // Extract shopping list items from a sentence
  const parseItems = async (utterance) => {
    const schema = {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "string" }
            },
            required: ["name"]
          }
        }
      }
    };
    const prompt = `
      Extract shopping list items from: "${utterance}".
      Return an array "items" with objects {name, quantity?}.
      - If a quantity like "2x", "two", "500g", "1L" is present, include it in quantity.
      - Otherwise set quantity to "1x".
      - Do NOT include prices or stores.
      Respond ONLY using the schema.
    `;
    const res = await InvokeLLM({ prompt, response_json_schema: schema });
    const items = Array.isArray(res?.items) ? res.items : [];
    return items.map(i => ({
      name: (i.name || "").trim(),
      quantity: (i.quantity || "1x").trim(),
      category: "general"
    })).filter(i => i.name);
  };

  // Add items to a default "My Voice List" (create if needed), then open ShoppingLists
  const addItemsToVoiceList = async (utterance) => {
    const itemsToAdd = await parseItems(utterance);
    if (!itemsToAdd.length) {
      const msg = "I couldn't find any items to add. Please say something like “add two milk and a loaf of bread”.";
      setResponse(msg); await speakResponse(msg);
      return true;
    }

    const listName = "My Voice List";
    const existing = await ShoppingList.filter({ name: listName }, "-updated_date", 1);
    const list = existing?.[0] || await ShoppingList.create({
      name: listName,
      original_text: "",
      items: [],
      status: "draft"
    });

    const mergedItems = [...(list.items || []), ...itemsToAdd];
    const appendedText = [
      list.original_text || "",
      ...itemsToAdd.map(i => `${i.quantity} ${i.name}`)
    ].filter(Boolean).join("\n");

    await ShoppingList.update(list.id, {
      items: mergedItems,
      original_text: appendedText
    });

    const msg = `Added ${itemsToAdd.length} item${itemsToAdd.length > 1 ? "s" : ""} to your list. Opening your shopping lists now.`;
    setResponse(msg); await speakResponse(msg);

    setTimeout(() => {
      navigate(createPageUrl("ShoppingLists"));
    }, 300);
    return true;
  };

  // Create a new empty list and open ShoppingLists
  const createNewList = async () => {
    const name = `New List ${new Date().toLocaleDateString()}`;
    await ShoppingList.create({
      name,
      original_text: "",
      items: [],
      status: "draft"
    });
    const msg = `I've created a new list called ${name}. Opening your shopping lists.`;
    setResponse(msg); await speakResponse(msg);
    setTimeout(() => {
      navigate(createPageUrl("ShoppingLists"));
    }, 300);
    return true;
  };

  // Summarise what's on the most recent list and open ShoppingLists
  const openLatestList = async () => {
    const lists = await ShoppingList.list("-updated_date", 1);
    const latest = lists?.[0];
    if (!latest) {
      const msg = "You don't have any lists yet. Would you like me to create one?";
      setResponse(msg); await speakResponse(msg);
      return true;
    }
    const count = latest.items?.length || 0;
    const preview = (latest.items || []).slice(0, 3).map(i => i.name).join(", ");
    const msg = `Your latest list "${latest.name}" has ${count} item${count !== 1 ? "s" : ""}${count ? `, for example: ${preview}.` : "."} Opening your shopping lists.`;
    setResponse(msg); await speakResponse(msg);
    setTimeout(() => {
      navigate(createPageUrl("ShoppingLists"));
    }, 300);
    return true;
  };

  // Open meal planner page
  const openMealPlanner = async () => {
    const msg = "Opening the AI Meal Planner.";
    setResponse(msg); await speakResponse(msg);
    setTimeout(() => {
      navigate(createPageUrl("MealPlanner"));
    }, 300);
    return true;
  };

  // Open coupons page, optionally with a store hint
  const openCoupons = async (utterance) => {
    const storeHints = ["tesco","asda","sainsbury","sainsbury's","morrisons","waitrose","aldi","lidl","coop","ocado","iceland"];
    const found = storeHints.find(s => new RegExp(`\\b${s}\\b`, "i").test(utterance));
    const storeParam = found ? `?store=${encodeURIComponent(found.replace(/'s$/i,"").toLowerCase())}` : "";
    const msg = found ? `Looking for vouchers for ${found}.` : "Opening coupons and deals.";
    setResponse(msg); await speakResponse(msg);
    setTimeout(() => {
      navigate(createPageUrl(`CouponsDeals${storeParam}`));
    }, 300);
    return true;
  };

  // Central enhanced router; returns true if it handled the utterance
  const routeByEnhancedIntents = async (utterance) => {
    const schema = {
      type: "object",
      properties: {
        intent: { type: "string", enum: ["compare_product","add_to_list","create_list","open_list","meal_plan","coupons","general_question"] },
        product_name: { type: "string" },
        confidence: { type: "number" }
      }
    };
    const prompt = `
      Analyze: "${utterance}" and pick ONE intent:
      - compare_product (if they say 'compare', 'price', or name a specific item)
      - add_to_list (e.g., 'add milk', 'add eggs and bread')
      - create_list (e.g., 'create a new list')
      - open_list (e.g., "what's on my shopping list")
      - meal_plan (e.g., 'create me a meal plan')
      - coupons (only if vouchers/discount codes explicitly requested)
      - general_question
      Extract product_name for compare_product.
      Respond with the schema only.
    `;
    const analysis = await InvokeLLM({ prompt, response_json_schema: schema });
    const intent = analysis?.intent;
    if (intent === "compare_product" && analysis?.product_name) {
      return await runComparisonForProduct(analysis.product_name);
    }
    if (intent === "add_to_list") return await addItemsToVoiceList(utterance);
    if (intent === "create_list") return await createNewList();
    if (intent === "open_list") return await openLatestList();
    if (intent === "meal_plan") return await openMealPlanner();
    if (intent === "coupons") return await openCoupons(utterance);
    return false; // general_question or not recognized
  };

  // Map our local intents to VoiceCommand entity enum
  const mapIntentForEntity = (intent) => {
    switch (intent) {
      case "compare_product": return "compare_prices";
      case "add_to_list": return "add_item";
      case "create_list": return "create_list";
      case "meal_plan": return "meal_plan";
      case "open_list": return "view_list"; 
      case "coupons": return "view_coupons"; 
      case "general_question": return "general_query";
      default: return "unknown";
    }
  };

  // Original processVoiceCommand logic, now renamed for internal use.
  // This function will set `response` state and `speakResponse` directly.
  const _legacyProcessVoiceCommand = async (transcript) => {
    setIsProcessing(true);
    setError('');

    try {
      // Confirmation branch
      if (awaitingConfirmation && pendingProduct) {
        const isYes = /^(yes|yeah|yep|correct|that's right|right|sure|ok)$/i.test(transcript.trim());
        const isNo = /^(no|nope|wrong|not that|try again|cancel)$/i.test(transcript.trim());

        if (isYes) {
          // Calls the new runComparisonForProduct
          await runComparisonForProduct(pendingProduct);
          setAwaitingConfirmation(false);
          setPendingProduct(null);
          setIsProcessing(false);
          return;
        } else if (isNo) {
          const response = "No problem. What product would you like me to compare?";
          setResponse(response);
          await speakResponse(response);
          setAwaitingConfirmation(false);
          setPendingProduct(null);
          setIsProcessing(false);
          return;
        }
      }

      // Expanded, stricter intent schema to cover all flows
      const commandSchema = {
        type: "object",
        properties: {
          intent: { type: "string", enum: ["compare_product", "add_to_list", "create_list", "open_list", "meal_plan", "coupons", "general_question"] },
          product_name: { type: "string" },
          confidence: { type: "number" },
          suggested_response: { type: "string" }
        }
      };

      const intentPrompt = `
        Analyze: "${transcript}".
        Choose ONE intent from: compare_product, add_to_list, create_list, open_list, meal_plan, coupons, general_question.
        Rules:
        - Prefer compare_product if "compare" or a specific item is mentioned.
        - "what's on my shopping list" -> open_list.
        - "add milk ..." etc -> add_to_list.
        - "create a meal plan" -> meal_plan.
        - Only return coupons if vouchers/discount codes are explicitly requested.
        Extract product_name for compare_product when possible.
        Return JSON only, matching the schema.
        Examples:
        - "compare bell's whisky" -> compare_product + product_name "Bell's whisky"
        - "add milk and eggs" -> add_to_list
        - "what's on my shopping list" -> open_list
        - "create a meal plan" -> meal_plan
        - "find tesco vouchers" -> coupons
      `;

      const commandAnalysis = await InvokeLLM({
        prompt: intentPrompt,
        response_json_schema: commandSchema
      });

      // Route to the appropriate action
      const intent = commandAnalysis.intent;

      let actionTaken = false; // Flag to indicate if a specific action was triggered

      if (intent === 'compare_product' && commandAnalysis.product_name) {
        const conf = typeof commandAnalysis.confidence === 'number' ? commandAnalysis.confidence : 0.5;
        if (conf >= 0.7) {
          await runComparisonForProduct(commandAnalysis.product_name); // Calls new function
          actionTaken = true;
        } else {
          const confirmationMessage = `Did you mean "${commandAnalysis.product_name}"?`;
          setResponse(confirmationMessage);
          await speakResponse(confirmationMessage);
          setAwaitingConfirmation(true);
          setPendingProduct(commandAnalysis.product_name);
          actionTaken = true; // Confirmation is an action
        }
      } else if (intent === 'add_to_list') {
        await addItemsToVoiceList(transcript); // Calls new function
        actionTaken = true;
      } else if (intent === 'create_list') {
        await createNewList(); // Calls new function
        actionTaken = true;
      } else if (intent === 'open_list') {
        await openLatestList(); // Calls new function
        actionTaken = true;
      } else if (intent === 'meal_plan') {
        await openMealPlanner(); // Calls new function
        actionTaken = true;
      } else if (intent === 'coupons') {
        await openCoupons(transcript); // Calls new function
        actionTaken = true;
      } else {
        // general_question or unknown
        // This handleOtherIntents provides generic suggestions for _legacyProcessVoiceCommand
        await handleOtherIntents(commandAnalysis, transcript);
        // Do not set actionTaken = true here, as it means the original LLM wasn't specific.
      }

      // Log to VoiceCommand with allowed enum mapping, only if a specific action was taken
      if (actionTaken) {
        const mappedIntent = mapIntentForEntity(intent);
        // Note: response state might be slightly behind, but this is for logging
        await VoiceCommand.create({
          command_text: transcript,
          intent: mappedIntent,
          confidence_score: commandAnalysis.confidence || 0,
          response_generated: response, 
          action_taken: mappedIntent
        });
      }

    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorResponse = "Sorry, I couldn't understand that. Please try again.";
      setResponse(errorResponse);
      await speakResponse(errorResponse);
    }

    setIsProcessing(false);
  };

  // This `handleOtherIntents` is only called by `_legacyProcessVoiceCommand`
  // when its initial LLM intent classification is 'general_question' or 'unknown'.
  // It provides a generic fallback.
  const handleOtherIntents = async (analysis, transcript) => {
    let responseText = analysis.suggested_response || "I'm here to help with comparisons, lists, and savings. What would you like to do?";
    setResponse(responseText);
    await speakResponse(responseText);
  };


  // This is the new `processVoiceCommand` function. It acts as an interceptor.
  // It is the function assigned to `recognitionRef.current.onresult`.
  const processVoiceCommand = async (transcript) => {
    // 1. Call the original, legacy logic. This will set the `response` state.
    await _legacyProcessVoiceCommand(transcript);

    // 2. After the legacy logic runs, check the current `response` state.
    // Give React a moment for state updates to potentially propagate.
    // A small setTimeout(0) or relying on typical async state update behaviour often suffices.
    // For more robust solutions, _legacyProcessVoiceCommand could return the message string it set.
    setTimeout(async () => {
      const lastReplyText = typeof response === "string" ? response : "";

      // 3. If the legacy logic didn't provide a specific response, or if it gave the "coupon-only" fallback,
      // then route via the enhanced intent system.
      if (!lastReplyText || COUPON_ONLY_MSG.test(lastReplyText)) {
        const handledByEnhanced = await routeByEnhancedIntents(transcript);
        if (!handledByEnhanced) {
          // If even the enhanced routing didn't handle it, provide a final general fallback.
          const fallback = "Try saying: “compare Bell’s whisky”, “add milk to my shopping list”, “what’s on my shopping list”, or “create a meal plan”.";
          setResponse(fallback);
          await speakResponse(fallback);
        }
      }
    }, 0); // Small delay to allow previous setResponse to potentially update state
  };


  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setResponse('');
      setAwaitingConfirmation(false);
      setPendingProduct(null);
      setError('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const resetConversation = () => {
    setTranscript('');
    setResponse('');
    setAwaitingConfirmation(false);
    setPendingProduct(null);
    setError('');
    stopSpeaking();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
              <p>Loading voice shopping...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Badge className="mt-2 bg-purple-100 text-purple-800">Premium Feature</Badge>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Voice Interface (replaces old Voice Control Panel) */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-purple-600" />
                Voice Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Listening Animation / Default Mic */}
              {isListening ? (
                <ListeningAnimation isListening={true} />
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Mic className="w-12 h-12 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice Shopping Assistant</h2>
                    <p className="text-gray-600">Click the microphone and say what you need</p>
                  </div>
                </div>
              )}

              {/* Voice Controls (Buttons) */}
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <Button
                  onClick={startListening}
                  disabled={isListening || isProcessing || !isRecognitionAvailable || user?.subscription_status === 'expired'}
                  size="lg"
                  className={`${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} px-8`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      Listening...
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Start Listening
                    </>
                  )}
                </Button>

                {isListening && (
                  <Button
                    onClick={stopListening}
                    variant="outline"
                    size="lg"
                    className="px-8"
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    Stop Listening
                  </Button>
                )}

                {isPlaying && (
                  <Button variant="outline" onClick={stopSpeaking} size="lg" className="px-8">
                    <Pause className="w-5 h-5 mr-2" />
                    Stop Speaking
                  </Button>
                )}

                <Button variant="outline" onClick={resetConversation} size="lg" className="px-8">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </div>

              {/* Statuses and Processing State */}
              <div className="space-y-3 mt-6">
                {isProcessing && !isListening && (
                  <div className="flex items-center justify-center gap-3 text-blue-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing your request...</span>
                  </div>
                )}

                {awaitingConfirmation && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Waiting for your confirmation. Say "yes" or "no".
                    </AlertDescription>
                  </Alert>
                )}

                {transcript && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">You said:</h4>
                    <p className="text-blue-800">"{transcript}"</p>
                  </div>
                )}

                {response && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-1 flex items-center gap-2">
                      Assistant Response:
                      {isPlaying && <Volume2 className="w-4 h-4 animate-pulse" />}
                    </h4>
                    <p className="text-purple-800">{response}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Commands */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                Example Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">🛒 Product Comparison</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>"Compare Bells whisky"</li>
                    <li>"Compare Coca Cola 2 liter"</li>
                    <li>"Compare iPhone 15"</li>
                    <li>"Compare Warburtons bread"</li>
                  </ul>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📝 Shopping Lists</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>"Add milk to my shopping list"</li>
                    <li>"Create a new shopping list"</li>
                    <li>"What's on my shopping list?"</li>
                    <li>"Add eggs and bread to my list"</li>
                  </ul>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">❓ Other Actions</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>"Find me Tesco vouchers"</li>
                    <li>"Open meal planner"</li>
                    <li>"What's new?"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
