
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContactMessage } from "@/api/entities";
import { SendEmail } from "@/api/integrations"; // Import SendEmail
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Send } from 'lucide-react';

export default function ContactModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '', reason: '' });
  const [spamAnswer, setSpamAnswer] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleReasonChange = (value) => {
    setFormData(prev => ({ ...prev, reason: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (spamAnswer !== '4') {
      setError('Incorrect answer to the spam question. Please try again.');
      return;
    }
    
    if (!formData.reason) {
      setError('Please select a reason for contact.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the contact message record
      await ContactMessage.create({
        ...formData,
        subject: `[${formData.reason}] Contact Form Submission`,
      });

      // 2. Send email notification
      await SendEmail({
        to: 'paul@redlimewebdesign.co.uk',
        subject: `New MyShopRun Contact Message: ${formData.reason}`,
        body: `
          A new message has been submitted on MyShopRun.
          <br><br>
          <strong>Name:</strong> ${formData.name}<br>
          <strong>Email:</strong> ${formData.email}<br>
          <strong>Reason:</strong> ${formData.reason}<br>
          <strong>Message:</strong><br>
          <p>${formData.message}</p>
        `
      });

      setIsSuccess(true);
    } catch (error) {
      console.error("Failed to send message:", error);
      setError('There was an error sending your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({ name: '', email: '', message: '', reason: '' });
      setSpamAnswer('');
      setError('');
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle>Contact Us</DialogTitle>
              <DialogDescription>
                Have a question or feedback? Let us know!
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formData.name} onChange={handleChange} required />
                </div>
                 <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
              </div>
               <div>
                  <Label htmlFor="reason">Reason for Contact</Label>
                  <Select onValueChange={handleReasonChange} value={formData.reason}>
                    <SelectTrigger id="reason">
                      <SelectValue placeholder="Select a reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Support issue">Support Issue</SelectItem>
                      <SelectItem value="Partnerships">Partnerships</SelectItem>
                      <SelectItem value="Careers">Careers</SelectItem>
                      <SelectItem value="Other Reason">Other Reason</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" value={formData.message} onChange={handleChange} required className="min-h-[100px]" />
              </div>
              <div>
                <Label htmlFor="spam">Spam Protection: What is 2 + 2?</Label>
                <Input id="spam" value={spamAnswer} onChange={(e) => setSpamAnswer(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-white bg-green-500 rounded-full mx-auto p-2 mb-4" />
            <h3 className="text-xl font-bold">Message Sent!</h3>
            <p className="text-gray-600 mt-2">Thank you for reaching out. We'll get back to you soon.</p>
            <Button onClick={handleClose} className="mt-6">Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
