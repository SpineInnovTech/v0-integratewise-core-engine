/**
 * DemoDataBanner — Shown when tenant has demo seed data
 *
 * Displays a subtle banner above the workspace content with:
 * - Message explaining sample data is active
 * - "Clean up sample data" button with confirmation
 * - Dismiss (X) to hide for current session
 */
import { useState } from "react";
import { Database, Trash2, X } from "lucide-react";

interface DemoDataBannerProps {
  onCleanup: () => void;
  isCleaning: boolean;
}

export function DemoDataBanner({ onCleanup, isCleaning }: DemoDataBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-iw-gold/20/60 px-6 py-2 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-iw-gold/10 flex items-center justify-center">
          <Database className="w-3.5 h-3.5 text-iw-gold" />
        </div>
        <span className="text-[13px] text-amber-800 font-medium">
          You&apos;re viewing <strong>sample data</strong> to help you explore IntegrateWise.
          Connect your tools or add real data anytime.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-4">
        {confirmOpen ? (
          <>
            <span className="text-iw-gold text-[12px] font-medium mr-1">
              Remove all sample data?
            </span>
            <button
              onClick={onCleanup}
              disabled={isCleaning}
              className="px-3 py-1 rounded-md text-[12px] font-bold text-white bg-iw-red hover:bg-iw-red disabled:opacity-50 transition-colors"
            >
              {isCleaning ? "Cleaning..." : "Yes, remove"}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-2 py-1 rounded-md text-[12px] font-medium text-iw-gold hover:bg-iw-gold/10 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-bold text-iw-gold bg-iw-gold/10/80 hover:bg-amber-200 border border-iw-gold/20/50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clean up sample data
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-md text-iw-gold-light hover:text-iw-gold hover:bg-iw-gold/10 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
