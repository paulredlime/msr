
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { ContactMessage } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Mail, 
  Reply,
  CheckCircle,
  Clock,
  Crown
} from "lucide-react";

export default function AdminMessages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  // Memoize loadMessages as it's called by checkAdminAccess and handleReply
  const loadMessages = useCallback(async () => {
    try {
      const allMessages = await ContactMessage.list('-created_date');
      setMessages(allMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [setMessages]); // setMessages is a stable setter, but including it is good practice for linters.

  // Memoize checkAdminAccess to prevent re-creation on every render
  const checkAdminAccess = useCallback(async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl("Dashboard"));
        return;
      }
      await loadMessages();
    } catch (error) {
      navigate(createPageUrl("SuperAdmin"));
    }
    setLoading(false);
  }, [navigate, loadMessages, setLoading]); // Include loadMessages and setLoading for complete dependency array

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]); // Now checkAdminAccess is a stable dependency

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    setSending(true);
    try {
      // Send email reply with branded sender name
      await SendEmail({
        to: selectedMessage.email,
        subject: `Re: ${selectedMessage.subject || 'Your inquiry'}`,
        body: replyText,
        from_name: 'MyShopRun Support' // Add branded sender name
      });

      // Update message status
      await ContactMessage.update(selectedMessage.id, {
        status: 'replied',
        admin_reply: replyText
      });

      setSelectedMessage(null);
      setReplyText('');
      await loadMessages(); // This will call the memoized version of loadMessages
    } catch (error) {
      console.error('Error sending reply:', error);
    }
    setSending(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new': return <Badge className="bg-blue-100 text-blue-800">New</Badge>;
      case 'replied': return <Badge className="bg-green-100 text-green-800">Replied</Badge>;
      case 'resolved': return <Badge className="bg-gray-100 text-gray-800">Resolved</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-700 font-medium">Loading Messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Admin Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(createPageUrl("AdminDashboard"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Contact Messages</h1>
                  <p className="text-sm text-gray-500">Manage customer inquiries</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {messages.length > 0 ? (
            <div className="space-y-6">
              {messages.map((message) => (
                <Card key={message.id} className="shadow-lg border-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{message.subject || 'General Inquiry'}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          From: {message.name} ({message.email}) • {new Date(message.created_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(message.status)}
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedMessage(message)}
                          disabled={message.status === 'replied'}
                        >
                          <Reply className="w-4 h-4 mr-2" />
                          {message.status === 'replied' ? 'Replied' : 'Reply'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{message.message}</p>
                    {message.admin_reply && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                        <p className="text-sm font-medium text-green-800 mb-1">Admin Reply:</p>
                        <p className="text-green-700">{message.admin_reply}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500">Customer inquiries will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to {selectedMessage?.name}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm font-medium text-gray-900 mb-2">Original Message:</p>
                <p className="text-gray-700">{selectedMessage.message}</p>
              </div>
              <div>
                <Textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-32"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleReply}
                  disabled={!replyText.trim() || sending}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {sending ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
