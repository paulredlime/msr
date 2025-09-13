import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Shield, Zap, ArrowRight } from 'lucide-react';

export default function AccountConnectionModal({ isOpen, onClose, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);

  const supermarkets = [
    { name: 'Tesco', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6105_image.png', url: 'https://www.tesco.com' },
    { name: 'ASDA', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b91670333_image.png', url: 'https://www.asda.com' },
    { name: 'Sainsbury\'s', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10fb1e1cb_image.png', url: 'https://www.sainsburys.co.uk' },
    { name: 'Morrisons', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/85bf5ae51_image.png', url: 'https://www.morrisons.com' }
  ];

  const steps = [
    {
      title: "Welcome to MyShopRun!",
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold">Account Created Successfully!</h3>
          <p className="text-gray-600">
            Let's get you set up to start saving money on your groceries. This will take just 2 minutes.
          </p>
        </div>
      )
    },
    {
      title: "Connect Your Supermarket Accounts",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 mb-4">
            Connect to your favourite supermarkets to unlock powerful features:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {supermarkets.map((store) => (
              <Card key={store.name} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <img src={store.logo} alt={store.name} className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-medium">{store.name}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 w-full"
                    onClick={() => window.open(store.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Auto-Fill Baskets</h4>
                <p className="text-blue-800 text-sm">
                  Connected accounts enable 1-click basket filling and automatic checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Security & Privacy",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold">Your Data is Secure</h3>
              <p className="text-gray-600">Bank-level encryption protects your information</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">All credentials encrypted with AES-256</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">Never stored in plain text</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">Used only for price comparison and basket filling</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">You can disconnect anytime from settings</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "You're All Set!",
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold">Ready to Start Saving!</h3>
          <p className="text-gray-600">
            You can now create shopping lists, compare prices, and auto-fill baskets across all major UK supermarkets.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              🎉 You're on a 7-day free trial of all premium features!
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{steps[currentStep].title}</span>
            <Badge variant="outline">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {steps[currentStep].content}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 
                  index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
            )}
            {currentStep === 0 && (
              <Button variant="outline" onClick={onSkip}>
                Skip Setup
              </Button>
            )}
            <Button onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}