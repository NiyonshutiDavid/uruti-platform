"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "./alert-dialog";
import { Button } from "./button";
import { Trash2, BookmarkMinus, UserMinus, AlertTriangle, type LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: LucideIcon;
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

/* ------------------------------------------------------------------ */
/*  Variant config                                                     */
/* ------------------------------------------------------------------ */

const variantConfig: Record<
  ConfirmVariant,
  { bg: string; iconColor: string; btnClass: string; DefaultIcon: LucideIcon }
> = {
  danger: {
    bg: "bg-red-50 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    btnClass: "bg-red-600 hover:bg-red-700 text-white",
    DefaultIcon: Trash2,
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    btnClass: "bg-amber-600 hover:bg-amber-700 text-white",
    DefaultIcon: AlertTriangle,
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    btnClass: "bg-blue-600 hover:bg-blue-700 text-white",
    DefaultIcon: AlertTriangle,
  },
};

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error("useConfirmDialog must be used within <ConfirmDialogProvider>");
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    description: "",
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const variant = options.variant ?? "danger";
  const config = variantConfig[variant];
  const Icon = options.icon ?? config.DefaultIcon;

  const handleOpenChange = useCallback((v: boolean) => {
    if (!v) handleCancel();
  }, [handleCancel]);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="sm:max-w-md glass-card border-black/5 dark:border-white/10 p-6">
          <AlertDialogHeader className="text-center space-y-4 pb-2">
            {/* Icon circle — matches logout style */}
            <div
              className={`mx-auto w-16 h-16 rounded-full ${config.bg} flex items-center justify-center mb-1`}
            >
              <Icon className={`h-8 w-8 ${config.iconColor}`} />
            </div>

            <AlertDialogTitle
              className="text-xl dark:text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {options.title}
            </AlertDialogTitle>

            <AlertDialogDescription
              className="text-sm text-muted-foreground"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {options.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 border-black/10 dark:border-white/20 hover:bg-[#76B947]/10"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {options.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              onClick={handleConfirm}
              className={`flex-1 ${config.btnClass}`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              <Icon className="mr-2 h-4 w-4" />
              {options.confirmLabel ?? "Confirm"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}
