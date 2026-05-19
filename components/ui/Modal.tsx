"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle2, Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full max-w-lg bg-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-lg font-black font-outfit uppercase tracking-tight">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirm?: boolean;
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  onConfirm,
  confirmLabel = "Continuer",
  cancelLabel = "Annuler",
  isConfirm = false
}: AlertDialogProps) {
  
  const icons = {
    info: <Info className="w-8 h-8 text-blue-500" />,
    success: <CheckCircle2 className="w-8 h-8 text-green-500" />,
    warning: <HelpCircle className="w-8 h-8 text-yellow-500" />,
    error: <AlertCircle className="w-8 h-8 text-red-500" />
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center space-y-6">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10",
          type === 'success' && "bg-green-500/10 border-green-500/20",
          type === 'error' && "bg-red-500/10 border-red-500/20",
        )}>
          {icons[type]}
        </div>
        
        <div className="space-y-2">
          <p className="text-white font-medium">{message}</p>
        </div>

        <div className="flex items-center gap-3 w-full pt-4">
          {isConfirm && (
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={cn(
              "flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all hover:scale-105",
              type === 'error' ? "bg-red-500 text-white shadow-red-500/20" : "bg-primary text-white shadow-primary/20"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
