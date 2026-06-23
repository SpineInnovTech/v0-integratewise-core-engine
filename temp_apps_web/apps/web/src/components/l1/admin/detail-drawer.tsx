"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DetailDrawer(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="fixed right-0 top-0 h-screen w-full max-w-xl translate-x-0 translate-y-0 rounded-none border-l border-slate-200 p-0">
        <div className="p-5 border-b border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base">{props.title}</DialogTitle>
            {props.description ? <DialogDescription>{props.description}</DialogDescription> : null}
          </DialogHeader>
        </div>
        <div className="p-5 overflow-y-auto h-[calc(100vh-84px)]">{props.children}</div>
      </DialogContent>
    </Dialog>
  );
}
