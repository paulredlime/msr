import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';
import { Referral } from '@/api/entities';

export default function ReferralManagementModal({ isOpen, onClose, user }) {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      const fetchReferrals = async () => {
        setLoading(true);
        try {
          const referralData = await Referral.filter({ referrer_user_id: user.id });
          setReferrals(referralData);
        } catch (error) {
          console.error("Failed to fetch referrals", error);
        } finally {
          setLoading(false);
        }
      };
      fetchReferrals();
    }
  }, [isOpen, user]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Referrals
          </DialogTitle>
          <DialogDescription>
            Track the status of friends you've invited. You earn a point when they upgrade!
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="text-sm font-medium">{ref.referred_user_email}</span>
                  <Badge variant={ref.status === 'converted' ? 'default' : 'secondary'}>
                    {ref.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500">You haven't referred anyone yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}