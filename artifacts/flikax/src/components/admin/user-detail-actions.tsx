"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  suspendUserAction,
  restoreUserAction,
  banUserAction,
  unbanUserAction,
  deleteUserAction,
  logWarningAction,
  toggleVerifiedAction,
} from "@/app/admin/users/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { withAuthRetry } from "@/lib/auth-retry";

const SUSPEND_DURATIONS = [3, 7, 14, 30];

export function UserDetailActions({
  userId,
  suspended,
  banned,
  verified,
}: {
  userId: string;
  suspended: boolean;
  banned: boolean;
  verified: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"ban" | "delete" | null>(null);
  const [suspendDays, setSuspendDays] = useState(7);
  const [warningMessage, setWarningMessage] = useState("");

  function run(action: () => Promise<void>, onDone?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(action);
        setConfirm(null);
        onDone?.();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  return (
    <Card className="gap-0 p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-800">Account actions</h2>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 border-t border-slate-300 pt-4">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Verification
        </span>
        {verified ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => toggleVerifiedAction(userId, false))}
          >
            Remove verification
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => run(() => toggleVerifiedAction(userId, true))}
          >
            Mark as verified
          </Button>
        )}
        <p className="mt-1 text-xs text-slate-400">Shows a verified badge on their public profile.</p>
      </div>

      <div className="mt-4 border-t border-slate-300 pt-4">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Suspend posting
        </span>
        {suspended ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => restoreUserAction(userId))}
            className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
          >
            Restore (lift suspension)
          </Button>
        ) : (
          <div className="flex gap-2">
            <select
              value={suspendDays}
              onChange={(e) => setSuspendDays(Number(e.target.value))}
              className="h-9 border border-input bg-transparent px-2 text-xs text-slate-800 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {SUSPEND_DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => run(() => suspendUserAction(userId, suspendDays))}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Suspend
            </Button>
          </div>
        )}
        <p className="mt-1 text-xs text-slate-400">Blocks new listings and plan purchases. Login stays open.</p>
      </div>

      <div className="mt-4 border-t border-slate-300 pt-4">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Login access
        </span>
        {banned ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => unbanUserAction(userId))}
            className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
          >
            Unban
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => setConfirm("ban")}
          >
            Ban
          </Button>
        )}
        <p className="mt-1 text-xs text-slate-400">Blocks login entirely until unbanned.</p>
      </div>

      <div className="mt-4 border-t border-slate-300 pt-4">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Log a warning
        </span>
        <Textarea
          rows={2}
          value={warningMessage}
          onChange={(e) => setWarningMessage(e.target.value)}
          placeholder="Recorded on this profile — not delivered to the user (no notification system exists yet)."
          className="text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || !warningMessage.trim()}
          onClick={() => run(() => logWarningAction(userId, warningMessage), () => setWarningMessage(""))}
          className="mt-2"
        >
          Log warning
        </Button>
      </div>

      <div className="mt-4 border-t border-slate-300 pt-4">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Danger zone
        </span>
        <Button type="button" size="sm" variant="destructive" disabled={isPending} onClick={() => setConfirm("delete")}>
          Delete account
        </Button>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "ban" ? "Ban this user?" : "Delete this account?"}
        message={
          confirm === "ban"
            ? "They will be immediately signed out and unable to log in until unbanned."
            : "This permanently deletes the account and cascades to their listings, payments, purchases, and feedback. This can't be undone."
        }
        confirmLabel={confirm === "ban" ? "Ban" : "Delete"}
        pending={isPending}
        onConfirm={() =>
          confirm === "ban"
            ? run(() => banUserAction(userId))
            : run(() => deleteUserAction(userId), () => router.push("/admin/users"))
        }
        onCancel={() => setConfirm(null)}
      />
    </Card>
  );
}
