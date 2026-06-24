import { useState } from "react";
import { useSpine } from "@/spine/spine-context";
import { TwinShell, type TwinSection } from "./twin-shell";

/**
 * Route wrapper for the Twin UI. Holds the active section locally and grounds
 * the Twin in the current spine context (role → CTXEnum). Rendered inside the
 * persistent workspace shell.
 */
export function TwinPage() {
  const { role } = useSpine();
  const [section, setSection] = useState<TwinSection>("Chat");

  return (
    <div className="h-full w-full">
      <TwinShell section={section} onSectionChange={setSection} activeCtx={role} />
    </div>
  );
}
