import React from "react";
import MobileApp from "./MobileApp";

export default function MobileAppPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">MyShopRun Mobile App Preview</h1>
        
        {/* Phone Frame */}
        <div className="relative">
          {/* Phone Frame */}
          <div className="w-80 h-[700px] bg-gray-900 rounded-[40px] p-3 shadow-2xl">
            {/* Screen */}
            <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-black/5 flex items-center justify-between px-6 text-xs font-medium text-gray-800 z-10">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-2 border border-gray-600 rounded-sm">
                    <div className="w-3 h-1 bg-green-500 rounded-sm m-0.5"></div>
                  </div>
                </div>
              </div>
              
              {/* App Content */}
              <div className="w-full h-full pt-6">
                <MobileApp />
              </div>
            </div>
          </div>
          
          {/* Phone Details */}
          <div className="mt-6 text-sm text-gray-600">
            <p>📱 Simulated iPhone 14 Pro</p>
            <p>Test your splash screen, login flow, and dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
}