import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TermsAndConditionsModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-6">
            <article className="prose lg:prose-xl max-w-none">
                <p>Please read these terms and conditions carefully before using Our Service.</p>

                <h2>1. Acknowledgment</h2>
                <p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
                <p>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</p>
                <p>By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.</p>

                <h2>2. User Accounts</h2>
                <p>When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.</p>
                <p>You are responsible for safeguarding the password that You use to access the Service and for any activities or actions under Your password. You agree not to disclose Your password to any third party.</p>

                <h2>3. Subscriptions</h2>
                <p>Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis (such as monthly or annually), depending on the type of Subscription plan you select when purchasing the Subscription.</p>
                <p>At the end of each period, Your Subscription will automatically renew under the exact same conditions unless You cancel it or the Company cancels it.</p>

                <h2>4. Intellectual Property</h2>
                <p>The Service and its original content, features and functionality are and will remain the exclusive property of the Company and its licensors.</p>

                <h2>5. Limitation of Liability</h2>
                <p>To the maximum extent permitted by applicable law, in no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever.</p>

                <h2>6. "As Is" and "As Available" Disclaimer</h2>
                <p>The Service is provided to You "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind.</p>
                
                <h2>7. Governing Law</h2>
                <p>The laws of the Country, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service.</p>
                
                <h2>8. Changes to These Terms and Conditions</h2>
                <p>We reserve the right, at Our sole discretion, to modify or replace these Terms at any time.</p>

                <h2>9. Contact Us</h2>
                <p>If you have any questions about these Terms and Conditions, you can contact us by email: [support@myshoprun.app]</p>
            </article>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}