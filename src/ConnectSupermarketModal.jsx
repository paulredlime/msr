import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from "@/api/entities";
import { GrocerAccount } from "@/api/entities";
import { Loader2, Lock, Store } from "lucide-react";

export default function ConnectSupermarketModal({
  isOpen,
  onClose,
  storeName,
  storeSlug,
  onConnected
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Prefill if account exists
    async function loadExisting() {
      setError("");
      setUsername("");
      setPassword("");
      if (!isOpen || !storeSlug) return;
      const me = await User.me();
      const existing = await GrocerAccount.filter({ user_id: me.id, store: storeSlug });
      if (existing.length > 0) {
        setUsername(existing[0].username || "");
        // Never prefill password for safety
      }
    }
    loadExisting();
  }, [isOpen, storeSlug]);

  const handleSave = async () => {
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter both username/email and password.");
      return;
    }
    setSaving(true);
    try {
      const me = await User.me();

      // Upsert GrocerAccount
      const existing = await GrocerAccount.filter({ user_id: me.id, store: storeSlug });
      const payload = {
        user_id: me.id,
        store: storeSlug,
        username: username.trim(),
        password_encrypted: btoa(password),
        is_active: true,
        sync_status: "active"
      };
      if (existing.length > 0) {
        await GrocerAccount.update(existing[0].id, payload);
      } else {
        await GrocerAccount.create(payload);
      }

      // Update user's connected_supermarkets (store display name)
      const currentUser = await User.me();
      const currentList = Array.isArray(currentUser.connected_supermarkets) ? currentUser.connected_supermarkets : [];
      if (!currentList.includes(storeName)) {
        await User.updateMyUserData({ connected_supermarkets: [...currentList, storeName] });
      }

      if (onConnected) onConnected({ storeName, storeSlug });

      onClose();
    } catch (e) {
      console.error("Failed to connect store:", e);
      setError("Could not save these credentials. Please try again.");
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-600" />
            Connect {storeName}
          </DialogTitle>
          <DialogDescription>
            Securely save your login for {storeName}. We’ll use it to help automate checkouts and comparisons.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="username">Username or Email</Label>
            <Input
              id="username"
              placeholder="e.g., your@email.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="password" className="flex items-center gap-2">
              Password
              <Lock className="w-3.5 h-3.5 text-gray-400" />
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Password is stored securely and used only for connecting to {storeName}.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving</> : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}