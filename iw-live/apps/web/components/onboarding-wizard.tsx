"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { getSelectedTools, persistSelectedTools, TOOL_CATALOG } from "@/lib/config"
import type { ToolSelection } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"

export function OnboardingWizard() {
  return null;
}
