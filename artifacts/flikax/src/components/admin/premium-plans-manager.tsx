"use client";

import { useState } from "react";
import { PremiumPlanForm } from "@/components/admin/premium-plan-form";
import { PremiumPlanRow } from "@/components/admin/premium-plan-row";
import { Card } from "@/components/ui/card";
import type { PremiumPlan } from "@/lib/premium-plans";

export function PremiumPlansManager({ initialPlans }: { initialPlans: PremiumPlan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const editingPlan = plans.find((p) => p.id === editingPlanId) ?? null;

  function handleSaved(saved: PremiumPlan) {
    setPlans((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      const next = exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved];
      return [...next].sort(
        (a, b) => a.display_order - b.display_order || a.created_at.localeCompare(b.created_at)
      );
    });
    setEditingPlanId(null);
  }

  function handleDeleted(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (editingPlanId === id) setEditingPlanId(null);
  }

  return (
    <>
      <Card className="gap-0 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800">
          {editingPlan ? `Edit "${editingPlan.name}"` : "Create a plan"}
        </h2>
        <div className="mt-3">
          <PremiumPlanForm
            key={editingPlan?.id ?? "new"}
            editingPlan={editingPlan}
            onSaved={handleSaved}
            onCancelEdit={() => setEditingPlanId(null)}
          />
        </div>
      </Card>

      <Card className="mt-6 gap-0 divide-y divide-slate-300 p-0 shadow-sm">
        {plans.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No plans yet.</p>
        ) : (
          plans.map((plan) => (
            <PremiumPlanRow
              key={plan.id}
              plan={plan}
              onEdit={() => setEditingPlanId(plan.id)}
              onDeleted={() => handleDeleted(plan.id)}
            />
          ))
        )}
      </Card>
    </>
  );
}
