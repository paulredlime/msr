import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "@/api/entities";
import { GrocerAccount } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PlugZap, Unplug } from "lucide-react";

const prettyName = (slugOrName) => {
  const map = {
    tesco: "Tesco", sainsburys: "Sainsbury's", asda: "ASDA", morrisons: "Morrisons",
    waitrose: "Waitrose", aldi: "Aldi", lidl: "Lidl", iceland: "Iceland", coop: "Co-op", ocado: "Ocado"
  };
  const key = (slugOrName || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "");
  return map[key] || slugOrName || "Unknown";
};

export default function ConnectedSupermarkets({ onChange }) {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const load = async () => {
    const me = await User.me();
    setUser(me);
    const list = await GrocerAccount.filter({ user_id: me.id, is_active: true });
    setAccounts(list);
  };

  useEffect(() => {
    load();
  }, []);

  const disconnect = async (acc) => {
    await GrocerAccount.update(acc.id, { is_active: false, sync_status: "disabled" });
    const me = await User.me();
    const list = Array.isArray(me.connected_supermarkets) ? me.connected_supermarkets : [];
    const toRemove = prettyName(acc.store);
    const updated = list.filter((x) => x !== toRemove);
    await User.updateMyUserData({ connected_supermarkets: updated });
    await load();
    if (onChange) onChange();
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="w-5 h-5 text-teal-600" />
          Connected Supermarkets
        </CardTitle>
        <CardDescription>Manage your connected accounts. These sync with your Profile.</CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-sm text-gray-600">
            No supermarkets connected yet. Connect from the store list below or visit{" "}
            <Link to={createPageUrl("Profile")} className="text-teal-600 underline">
              Profile
            </Link>.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">{prettyName(acc.store)}</div>
                  <div className="text-xs text-gray-500">{acc.username}</div>
                  <Badge variant="outline" className="mt-1">{acc.sync_status || "active"}</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => disconnect(acc)}>
                  <Unplug className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}