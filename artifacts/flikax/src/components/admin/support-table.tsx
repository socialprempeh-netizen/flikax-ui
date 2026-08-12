"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_TICKET_STATUS_LABELS, ADMIN_TICKET_STATUS_STYLES } from "@/lib/admin/support";
import { updateTicketStatusAction } from "@/app/admin/support/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { withAuthRetry } from "@/lib/auth-retry";

export type AdminTicketRow = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: string;
  createdAt: string;
};

export function SupportTable({ tickets }: { tickets: AdminTicketRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allSelected = tickets.length > 0 && selected.size === tickets.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(tickets.map((t) => t.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(ids: string[], status: string) {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(() => updateTicketStatusAction(ids, status));
        setSelected(new Set());
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  const selectedIds = Array.from(selected);

  if (tickets.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
        No support tickets match these filters.
      </div>
    );
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {selectedIds.length > 0 && (
        <div className="sticky top-14 z-20 mb-3 flex flex-wrap items-center gap-2 border border-brand/30 bg-brand-light px-4 py-3">
          <span className="text-sm font-bold text-slate-800">{selectedIds.length} selected</span>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => run(selectedIds, "in_progress")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Mark in progress
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => run(selectedIds, "resolved")}
            className="bg-green-600 hover:bg-green-700"
          >
            Resolve
          </Button>
        </div>
      )}

      <Card className="gap-0 divide-y divide-slate-300 overflow-hidden p-0 shadow-sm">
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Select all on this page
          </span>
        </div>

        {tickets.map((ticket) => (
          <div key={ticket.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
            <Checkbox
              checked={selected.has(ticket.id)}
              onCheckedChange={() => toggleOne(ticket.id)}
              aria-label={`Select ticket from ${ticket.name}`}
              className="mt-1 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{ticket.name}</span>
                <a href={`mailto:${ticket.email}`} className="text-sm text-brand-dark hover:underline">
                  {ticket.email}
                </a>
                <Badge className={`shrink-0 ${ADMIN_TICKET_STATUS_STYLES[ticket.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {ADMIN_TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm font-medium text-slate-600">{ticket.topic}</p>
              <p className="mt-1 text-sm text-slate-600">{ticket.message}</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleString()}</p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {ticket.status !== "in_progress" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run([ticket.id], "in_progress")}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  In progress
                </Button>
              )}
              {ticket.status !== "resolved" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run([ticket.id], "resolved")}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                >
                  Resolve
                </Button>
              )}
              {ticket.status !== "open" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run([ticket.id], "open")}
                >
                  Reopen
                </Button>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
