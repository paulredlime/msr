
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Mic, MicOff, Volume2, VolumeX, Send, Loader2, Bot, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/api/entities';
import { AppSettings } from "@/api/entities";
import { agentSDK } from '@/agents';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { generateSpeech } from '@/api/functions';

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    // Load mute state from localStorage
    return localStorage.getItem('chat_muted') === 'true';
  });
  const [user, setUser] = useState(null);
  const [defaultVoice, setDefaultVoice] = useState('en-US-Journey-F');
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    loadUser();
    loadDefaultVoice(); // Load default voice from admin settings
    return () => {
      // Cleanup on unmount
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // No need to cancel speechSynthesis anymore
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Update unread count when widget is closed
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    } else if (isOpen) {
      // Mark messages as read when widget is open
      setUnreadCount(0);
      messages.forEach(msg => {
        if (msg.role === 'assistant') {
          msg.isRead = true;
        }
      });
    }
  }, [isOpen, messages]);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadDefaultVoice = async () => {
    try {
      const voiceSettings = await AppSettings.filter({ setting_key: 'default_voice' });
      if (voiceSettings.length > 0) {
        setDefaultVoice(voiceSettings[0].setting_value);
      }
    } catch (error) {
      console.error('Error loading default voice:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    if (!conversation) {
      try {
        const newConversation = await agentSDK.createConversation({
          agent_name: 'shoppingAssistant',
          metadata: {
            name: 'Shopping Chat',
            description: 'Voice-enabled shopping assistant conversation'
          }
        });
        setConversation(newConversation);
        
        // Subscribe to updates
        const unsubscribe = agentSDK.subscribeToConversation(newConversation.id, (data) => {
          setMessages(data.messages || []);
          setIsTyping(false);
          
          // Auto-speak new assistant messages if not muted
          const lastMessage = data.messages[data.messages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.isSpoken && !isMuted) {
            speakMessage(lastMessage.content);
            lastMessage.isSpoken = true; // Mark as spoken to prevent re-speaking
          }
        });
        
        unsubscribeRef.current = unsubscribe;
        
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }
  };

  const sendMessage = async (message) => {
    if (!conversation) await initializeConversation();
    if (!conversation || !message.trim()) return;

    setIsLoading(true);
    setIsTyping(true);
    
    try {
      await agentSDK.addMessage(conversation, {
        role: 'user',
        content: message
      });
      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  // REPLACED: speakMessage now uses Google TTS and fetches latest user voice preference
  const speakMessage = async (text) => {
    if (!text || isMuted) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setIsSpeaking(true);
    
    try {
      // FIX: Fetch the latest user data to get the most recent voice preference
      const freshUser = await User.me();
      const voiceToUse = freshUser?.preferred_voice || defaultVoice;
      const languageCode = voiceToUse?.startsWith('en-GB') ? 'en-GB' : 'en-US';
      
      const response = await generateSpeech({
        text: text,
        voiceName: voiceToUse,
        languageCode: languageCode,
      });
      
      if (response.data && response.data.audioContent) {
        const audioSrc = `data:audio/mp3;base64,${response.data.audioContent}`;
        const audio = new Audio(audioSrc);
        audioRef.current = audio;
        
        audio.play();
        
        audio.onended = () => {
          setIsSpeaking(false);
        };
        
        audio.onerror = () => {
          console.error('Audio playback error');
          setIsSpeaking(false);
        };
      } else {
        throw new Error('No audio content received');
      }
    } catch (error) {
      console.error("Failed to generate speech:", error);
      setIsSpeaking(false);
      
      // Fallback to browser TTS if Google TTS fails
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('chat_muted', newMutedState.toString());
    
    // Stop any currently playing audio if muting
    if (newMutedState && audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        // Auto-send the transcribed message
        sendMessage(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="relative">
              <Button
                onClick={() => setIsOpen(true)}
                className="w-16 h-16 rounded-full bg-teal-600 hover:bg-teal-700 shadow-lg relative"
                size="icon"
              >
                <MessageCircle className="w-8 h-8 text-white" />
                {isSpeaking && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                )}
              </Button>
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px]"
          >
            <Card className="h-full flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="flex-row items-center justify-between p-4 border-b bg-teal-600 text-white rounded-t-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 bg-white/20">
                    <AvatarFallback className="bg-white/20 text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">Shopping Assistant</CardTitle>
                    {isTyping && <p className="text-xs text-teal-100">Assistant is typing...</p>}
                    {isSpeaking && <p className="text-xs text-teal-100">Speaking...</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className={`text-white hover:bg-white/20 ${isMuted ? 'bg-red-500/20' : ''}`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-teal-600" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">Welcome to your Shopping Assistant!</h3>
                      <p className="text-sm mb-4">I can help you with:</p>
                      <div className="text-xs space-y-1 text-left max-w-xs mx-auto">
                        <p>• Finding the best prices and deals</p>
                        <p>• Creating shopping lists</p>
                        <p>• Meal planning and recipes</p>
                        <p>• Product comparisons</p>
                      </div>
                      <p className="text-xs mt-4 text-teal-600">Try saying "Help me find coupons for Tesco" or click the mic button!</p>
                    </div>
                  )}
                  
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className={message.role === 'user' ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600'}>
                          {message.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <ReactMarkdown 
                            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input */}
                <div className="border-t bg-white p-4">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about products, prices, or shopping..."
                        className="pr-12"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleListening}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 ${
                          isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        disabled={isLoading}
                        title={isListening ? 'Stop listening' : 'Start voice input'}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={isLoading || !inputValue.trim()}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </form>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    <span className="flex items-center gap-1">
                      {isMuted ? (
                        <><VolumeX className="w-3 h-3" /> Muted</>
                      ) : (
                        <><Volume2 className="w-3 h-3" /> Voice on</>
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
