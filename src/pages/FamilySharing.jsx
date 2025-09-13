
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { FamilyGroup } from '@/api/entities';
import { ShoppingList } from '@/api/entities';
import { BudgetTracker } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Users, Plus, Crown, Mail, Trash2, Settings, Share2, CheckCircle, Copy, Send, UserCheck, UserX, QrCode, ArrowRight, ArrowLeft, Heart, Edit, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { sendEmail } from '@/api/functions';

export default function FamilySharing() {
  const [user, setUser] = useState(null);
  const [familyGroup, setFamilyGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Wizard states
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [inviteEmails, setInviteEmails] = useState(['']);
  const [permissions, setPermissions] = useState({
    shared_lists: true,
    shared_budget: true,
    shared_favorites: true,
    can_invite_others: false
  });
  
  const [sharedLists, setSharedLists] = useState([]);
  const [sharedBudgets, setSharedBudgets] = useState([]);
  const [inviteLink, setInviteLink] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newBudget, setNewBudget] = useState(0);

  const loadSharedData = useCallback(async (groupId) => {
    try {
      const [lists, budgets] = await Promise.all([
        ShoppingList.filter({ family_group_id: groupId, is_shared: true }),
        BudgetTracker.filter({ family_group_id: groupId, is_shared: true })
      ]);
      setSharedLists(lists);
      setSharedBudgets(budgets);
    } catch (error) {
      console.error('Error loading shared data:', error);
    }
  }, []);

  const loadUserAndFamily = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Check if user is part of a family group
      const groups = await FamilyGroup.filter({ admin_user_id: currentUser.id });
      const memberGroups = await FamilyGroup.filter({});
      const memberGroup = memberGroups.find(g => 
        g.members?.some(m => m.user_email === currentUser.email)
      );

      const myGroup = groups[0] || memberGroup;
      if (myGroup) {
        console.log('Raw family group data:', myGroup); // Debug log
        console.log('Current user:', currentUser); // Debug log
        setFamilyGroup(myGroup);
        setNewBudget(myGroup.shared_budget || 0);
        await loadSharedData(myGroup.id);
        // Generate invite link
        setInviteLink(`${window.location.origin}/family-invite/${myGroup.id}`);
      }
    } catch (error) {
      console.error('Error loading family data:', error);
    }
    setLoading(false);
  }, [loadSharedData]);

  useEffect(() => {
    loadUserAndFamily();
  }, [loadUserAndFamily]);

  const addInviteEmail = () => {
    setInviteEmails([...inviteEmails, '']);
  };

  const updateInviteEmail = (index, email) => {
    const updated = [...inviteEmails];
    updated[index] = email;
    setInviteEmails(updated);
  };

  const removeInviteEmail = (index) => {
    setInviteEmails(inviteEmails.filter((_, i) => i !== index));
  };

  const sendInvitationEmail = async (email, groupName, inviteUrl) => {
    console.log('Sending family invitation email to:', email);
    
    const subject = `You're invited to join ${groupName} on MyShopRun!`;
    const body_html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; }
                .header { background: linear-gradient(135deg, #9333ea 0%, #db2777 100%); color: white; padding: 40px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { padding: 30px; line-height: 1.6; }
                .content p { color: #495057; }
                .button-container { text-align: center; margin: 20px 0; }
                .button { display: inline-block; background: linear-gradient(135deg, #86198f 0%, #be185d 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
                .footer { background-color: #f1f3f5; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛒 You're Invited!</h1>
                </div>
                <div class="content">
                    <p>Hi there,</p>
                    <p>You've been invited by <strong>${user?.full_name || 'a friend'}</strong> to join the <strong>${groupName}</strong> family group on MyShopRun.</p>
                    <p>By joining, you'll get access to shared shopping lists, budgets, and premium features to help you save time and money on your groceries.</p>
                    <div class="button-container">
                        <a href="${inviteUrl}" class="button">Accept Invitation</a>
                    </div>
                    <p>We look forward to having you in the family!</p>
                    <p>Best regards,<br/>The MyShopRun Team</p>
                </div>
                <div class="footer">
                    <p>If the button doesn't work, copy and paste this link into your browser:<br/><a href="${inviteUrl}">${inviteUrl}</a></p>
                    <p>© ${new Date().getFullYear()} MyShopRun - Your Smart Shopping Companion</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    try {
      console.log('Calling sendEmail function...');
      const response = await sendEmail({
        to: email,
        subject: subject,
        from_name: `MyShopRun Family (${groupName})`,
        body_html: body_html
      });
      console.log('Email send response:', response);
      
      if (response.status === 200) {
        toast.success(`Invitation sent to ${email}`);
      } else {
        throw new Error('Email service returned non-200 status');
      }
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      toast.error(`Failed to send invitation email to ${email}. Please try again.`);
    }
  };

  const createFamilyGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      const validEmails = inviteEmails.filter(email => email.trim());
      const members = [
        { user_email: user.email, role: 'admin', joined_date: new Date().toISOString(), status: 'active' },
        ...validEmails.map(email => ({
          user_email: email.trim(),
          role: 'member',
          invited_date: new Date().toISOString(),
          status: 'invited'
        }))
      ];

      const newGroup = await FamilyGroup.create({
        group_name: groupName,
        admin_user_id: user.id,
        members,
        shared_budget: 200,
        shared_lists: [],
        shared_favorites: permissions.shared_favorites,
        permissions: permissions
      });
      
      setFamilyGroup(newGroup);
      setNewBudget(200);
      const generatedInviteLink = `${window.location.origin}/family-invite/${newGroup.id}`;
      setInviteLink(generatedInviteLink);
      setShowWizard(false);
      setWizardStep(1);
      toast.success('Family group created successfully!');
      
      // Send invitations for new group
      validEmails.forEach(email => {
        sendInvitationEmail(email, newGroup.group_name, generatedInviteLink);
      });
    } catch (error) {
      console.error('Error creating family group:', error);
      toast.error('Failed to create family group');
    }
  };

  const handleInviteNewMember = async () => {
    if (!newInviteEmail.trim() || !familyGroup) {
      toast.error("Please enter a valid email address.");
      return;
    }
    
    // Debug: Log current members
    console.log('Current family group members:', familyGroup.members);
    
    // Check if member already exists (check both active and invited)
    const existingMember = familyGroup.members?.find(m => m.user_email === newInviteEmail.trim());
    console.log('Existing member found:', existingMember); // Debug log
    
    if (existingMember) {
        if (existingMember.status === 'active') {
            toast.error("This user is already an active member of the family group.");
        } else {
            toast.error("This user already has a pending invitation. You can resend it from the pending invitations section below.");
        }
        return;
    }

    try {
      const newMember = {
        user_email: newInviteEmail.trim(),
        role: 'member',
        invited_date: new Date().toISOString(),
        status: 'invited'
      };
      
      const updatedMembers = [...(familyGroup.members || []), newMember];
      await FamilyGroup.update(familyGroup.id, { members: updatedMembers });
      
      // Refresh the family group data to ensure UI is in sync
      await loadUserAndFamily();
      
      // Send actual invitation email
      await sendInvitationEmail(newInviteEmail.trim(), familyGroup.group_name, inviteLink);
      
      setNewInviteEmail('');
      setShowInviteModal(false);

    } catch (error) {
      console.error('Error inviting new member:', error);
      toast.error('Failed to send invitation.');
    }
  };

  const resendInvite = async (email) => {
    try {
      await sendInvitationEmail(email, familyGroup.group_name, inviteLink);
    } catch (error) {
      toast.error('Failed to resend invitation');
    }
  };

  const removeMember = async (memberEmail) => {
    if (!familyGroup) return;

    try {
      const updatedMembers = familyGroup.members.filter(m => m.user_email !== memberEmail);
      await FamilyGroup.update(familyGroup.id, { members: updatedMembers });
      
      // Refresh the family group data to ensure UI is in sync
      await loadUserAndFamily();
      toast.success('Member removed from family group');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const updateBudget = async () => {
    if (!familyGroup || newBudget <= 0) {
      toast.error('Please enter a valid budget amount.');
      return;
    }
    try {
      await FamilyGroup.update(familyGroup.id, { shared_budget: newBudget });
      setFamilyGroup({ ...familyGroup, shared_budget: newBudget });
      toast.success('Family budget updated!');
      setShowBudgetModal(false);
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget.');
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!familyGroup) {
    return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-purple-50 to-pink-100 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {!showWizard ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Family Sharing</h1>
              <p className="text-lg text-gray-600 mb-8">Share your subscription, lists, and budgets with your family members.</p>
              
              <Card className="max-w-md mx-auto shadow-xl border-0 bg-white/90 backdrop-blur">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-6 text-center">Ready to Get Started?</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-left">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Share premium features with up to 5 family members</span>
                    </div>
                    <div className="flex items-center gap-3 text-left">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Collaborate on shopping lists and budgets</span>
                    </div>
                    <div className="flex items-center gap-3 text-left">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Real-time notifications and updates</span>
                    </div>
                  </div>
                  <Button onClick={() => setShowWizard(true)} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Family Group
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Wizard UI
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Create Family Group</CardTitle>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    Step {wizardStep} of 3
                  </Badge>
                </div>
                <Progress value={(wizardStep / 3) * 100} className="mt-4" />
              </CardHeader>
              <CardContent className="p-8">
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Name Your Family Group</h3>
                      <p className="text-gray-600">Choose a name that everyone in your family will recognize</p>
                    </div>
                    <div>
                      <Label htmlFor="groupName" className="text-lg font-medium">Family Group Name</Label>
                      <Input
                        id="groupName"
                        placeholder="e.g., The Smith Family, Home Sweet Home"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="mt-2 text-lg py-3"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setWizardStep(2)} 
                        disabled={!groupName.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Next: Add Members
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Invite Family Members</h3>
                      <p className="text-gray-600">Add up to 5 family members by email address</p>
                    </div>
                    <div className="space-y-4">
                      {inviteEmails.map((email, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex-1">
                            <Input
                              type="email"
                              placeholder="family.member@example.com"
                              value={email}
                              onChange={(e) => updateInviteEmail(index, e.target.value)}
                              className="py-3"
                            />
                          </div>
                          {inviteEmails.length > 1 && (
                            <Button 
                              variant="outline" 
                              onClick={() => removeInviteEmail(index)}
                              className="px-3"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {inviteEmails.length < 5 && (
                      <Button onClick={addInviteEmail} variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Family Member
                      </Button>
                    )}
                    
                    <div className="flex justify-between">
                      <Button 
                        onClick={() => setWizardStep(1)} 
                        variant="outline"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button 
                        onClick={() => setWizardStep(3)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Next: Set Permissions
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Configure Permissions</h3>
                      <p className="text-gray-600">Choose what your family members can access and modify</p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">Shared Shopping Lists</h4>
                          <p className="text-sm text-gray-600">Allow family members to create and edit shared lists</p>
                        </div>
                        <Switch
                          checked={permissions.shared_lists}
                          onCheckedChange={(checked) => setPermissions({...permissions, shared_lists: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">Shared Budget</h4>
                          <p className="text-sm text-gray-600">Share family budget and spending tracking</p>
                        </div>
                        <Switch
                          checked={permissions.shared_budget}
                          onCheckedChange={(checked) => setPermissions({...permissions, shared_budget: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">Shared Favorites</h4>
                          <p className="text-sm text-gray-600">Share favorite items and price alerts</p>
                        </div>
                        <Switch
                          checked={permissions.shared_favorites}
                          onCheckedChange={(checked) => setPermissions({...permissions, shared_favorites: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">Can Invite Others</h4>
                          <p className="text-sm text-gray-600">Allow members to invite additional family members</p>
                        </div>
                        <Switch
                          checked={permissions.can_invite_others}
                          onCheckedChange={(checked) => setPermissions({...permissions, can_invite_others: checked})}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        onClick={() => setWizardStep(2)} 
                        variant="outline"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button 
                        onClick={createFamilyGroup}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Create Family Group
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  const isAdmin = familyGroup.admin_user_id === user?.id;
  
  // Proper member filtering with fallback for missing status
  const allMembers = familyGroup.members || [];
  const activeMembers = allMembers.filter(m => 
    m.status === 'active' || 
    (!m.status && m.joined_date) || // Handle legacy data - if no status but has joined_date, consider active
    (m.user_email === user?.email && m.role === 'admin') // Admin is always active
  );
  const invitedMembers = allMembers.filter(m => 
    m.status === 'invited' || 
    (!m.status && !m.joined_date && m.user_email !== user?.email) // Handle legacy data - if no status and no joined_date (and not current user), consider invited
  );

  // Debug logging
  console.log('=== FAMILY SHARING DEBUG ===');
  console.log('Current user:', user);
  console.log('Family Group admin_user_id:', familyGroup.admin_user_id);
  console.log('Is Admin:', isAdmin);
  console.log('All members:', allMembers);
  console.log('Active members:', activeMembers);
  console.log('Invited members:', invitedMembers);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-purple-50 to-pink-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              {familyGroup.group_name}
            </h1>
            <p className="text-gray-600 mt-2">
              {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''} • 
              {invitedMembers.length} pending invitation{invitedMembers.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {isAdmin && (
            <div className="flex gap-3">
              <Button onClick={() => setShowQRCode(true)} variant="outline">
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
              <Button onClick={copyInviteLink} className="bg-purple-600 hover:bg-purple-700">
                <Copy className="w-4 h-4 mr-2" />
                Copy Invite Link
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Family Members */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  Family Members
                </CardTitle>
                {isAdmin && (
                  <Button variant="ghost" size="sm" className="bg-white/10 hover:bg-white/20" onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Active Members */}
                  {activeMembers.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Active Members ({activeMembers.length})
                      </h4>
                      {activeMembers.map((member, index) => (
                        <div key={`active-${index}`} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                              {member.role === 'admin' ? (
                                <Crown className="w-5 h-5 text-white" />
                              ) : (
                                <Users className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{member.user_email}</p>
                              <div className="flex gap-2">
                                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                  {member.role === 'admin' ? 'Family Admin' : 'Member'}
                                </Badge>
                                {member.joined_date && (
                                  <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                                    Active since {new Date(member.joined_date).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Only show remove option for non-admin members and if current user is admin */}
                          {isAdmin && member.role !== 'admin' && member.user_email !== user?.email && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(member.user_email)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Invited Members */}
                  <div>
                    {activeMembers.length > 0 && invitedMembers.length > 0 && <Separator className="my-4" />}
                    <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Pending Invitations ({invitedMembers.length})
                    </h4>
                    {invitedMembers.length > 0 ? (
                      invitedMembers.map((member, index) => (
                        <div key={`invited-${index}`} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{member.user_email}</p>
                              {member.invited_date && (
                                <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                                  Invited {new Date(member.invited_date).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resendInvite(member.user_email)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Resend
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMember(member.user_email)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No pending invitations</p>
                        <p className="text-sm">Click &quot;Invite Member&quot; to add new family members</p>
                      </div>
                    )}
                  </div>

                  {/* No Members Message */}
                  {activeMembers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No family members yet</p>
                      <p className="text-sm">Start by inviting your first family member</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Family Budget */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="w-6 h-6" />
                    Family Budget
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20" onClick={() => setShowBudgetModal(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-700 mb-2">
                  £{familyGroup.shared_budget?.toLocaleString() || 0}
                </div>
                <p className="text-gray-600 mb-4">Monthly Shared Budget</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: '23%' }}></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Spent: £46.50</span>
                  <span>23%</span>
                </div>
              </CardContent>
            </Card>

            {/* Shared Activity */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <Share2 className="w-6 h-6" />
                  Shared Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Shared Lists</span>
                    <Badge variant="outline">{sharedLists.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Shared Budgets</span>
                    <Badge variant="outline">{sharedBudgets.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Alerts</span>
                    <Badge variant="outline">7</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* QR Code Modal */}
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Family Group QR Code</DialogTitle>
            </DialogHeader>
            <div className="text-center py-6">
              <div className="w-48 h-48 bg-white border rounded-lg mx-auto mb-4 flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteLink)}`}
                  alt="Family Group QR Code"
                  className="w-44 h-44"
                />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Family members can scan this QR code to join {familyGroup.group_name}
              </p>
              <p className="text-xs text-gray-500 mb-4 bg-gray-100 p-2 rounded">
                {inviteLink}
              </p>
              <Button onClick={copyInviteLink} variant="outline" className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Copy Invite Link Instead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Budget Edit Modal */}
        <Dialog open={showBudgetModal} onOpenChange={setShowBudgetModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Family Budget</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="family-budget">New Monthly Budget Amount (£)</Label>
              <Input
                id="family-budget"
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(Number(e.target.value))}
                placeholder="e.g., 500"
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBudgetModal(false)}>Cancel</Button>
              <Button onClick={updateBudget} className="bg-green-600 hover:bg-green-700">Save Budget</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invite New Member Modal */}
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Family Member</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="new-invite-email">Member's Email Address</Label>
              <Input
                id="new-invite-email"
                type="email"
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button onClick={handleInviteNewMember} className="bg-purple-600 hover:bg-purple-700">
                <Send className="w-4 h-4 mr-2" />
                Send Invite
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
