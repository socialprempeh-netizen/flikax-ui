import { Wallet } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

// Placeholder -- there's no wallet/balance table or top-up flow built yet.
// This route exists so the dashboard nav link has somewhere to go instead
// of a 404; swap in the real page once the wallet feature is built.
export default function GhcBalancePage() {
  return (
    <ComingSoon
      icon={Wallet}
      title="GHC Balance"
      description="Manage your Flikax wallet balance for featured ads and other paid boosts."
    />
  );
}
