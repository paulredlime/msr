import React from 'react';
import { Mic } from 'lucide-react';

export default function ListeningAnimation({ isListening = false }) {
  if (!isListening) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Animated Microphone */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
        <div className="relative w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
          <Mic className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Sound Wave Animation */}
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-red-500 rounded-full animate-pulse"
            style={{
              height: `${Math.random() * 20 + 10}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.8s'
            }}
          ></div>
        ))}
      </div>

      {/* Listening Text */}
      <div className="text-center">
        <p className="text-lg font-semibold text-red-600">Listening...</p>
        <p className="text-sm text-gray-500">Speak clearly into your microphone</p>
      </div>

      {/* Pulsing Border Effect */}
      <style jsx>{`
        @keyframes soundwave {
          0%, 100% { height: 10px; }
          50% { height: 25px; }
        }
        .animate-soundwave {
          animation: soundwave 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}