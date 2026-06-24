/**
 * GovernanceGate — wraps every destructive / state-changing write behind an
 * explicit human confirmation step.
 *
 * Doctrine (M5): governance gates every write; the human runs every action.
 * The twin proposes; this component is what converts a proposal into execution.
 *
 * Usage (controlled):
 *   const gate = useGovernanceGate();
 *   gate.request({ ... })   // opens the gate
 *   <GovernanceGate gate={gate} />
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useCallback } from "react";
import { Shield } from "lucide-react";

export interface GovernanceRequest {
  /** Short operation name shown as the title: "Qualify lead", "Convert lead" */
  operation: string;
  /** The subject entity — name of the lead, record, etc. */
  entity: string;
  /** What will happen if the user confirms — be specific about side-effects */
  impact: string;
  /** The function to call when the user confirms */
  onConfirm: () => void;
  /** Danger level — drives button color */
  danger?: boolean;
}

export interface GovernanceGateHandle {
  request: (req: GovernanceRequest) => void;
}

export function useGovernanceGate(): GovernanceGateHandle & {
  current: GovernanceRequest | null;
  dismiss: () => void;
} {
  const [current, setCurrent] = useState<GovernanceRequest | null>(null);

  const request = useCallback((req: GovernanceRequest) => {
    setCurrent(req);
  }, []);

  const dismiss = useCallback(() => {
    setCurrent(null);
  }, []);

  return { request, current, dismiss };
}

export function GovernanceGate({
  gate,
}: {
  gate: ReturnType<typeof useGovernanceGate>;
}) {
  const { current, dismiss } = gate;

  return (
    <AlertDialog open={current !== null} onOpenChange={(o) => !o && dismiss()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {current?.operation ?? "Confirm action"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-foreground">
                  {current?.entity}
                </span>
              </p>
              <p className="text-muted-foreground">{current?.impact}</p>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone automatically. Review before
                confirming.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={dismiss}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              current?.onConfirm();
              dismiss();
            }}
            className={
              current?.danger
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
