"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
};

const ToastContext = createContext<{
  notify: (toast: Omit<Toast, "id">) => void;
} | null>(null);

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const tones = {
  success: "border-success/20 bg-success/10 text-success",
  error: "border-danger/20 bg-danger/10 text-danger",
  info: "border-primary/20 bg-primary/10 text-primary",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { ...toast, id }].slice(-4));
      window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed right-4 top-4 z-50 grid w-[calc(100vw-2rem)] max-w-sm gap-3">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];

          return (
            <div
              key={toast.id}
              className={`rounded-xl border p-4 backdrop-blur-xl ${tones[toast.type]}`}
              role="status"
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-starlight">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm opacity-80">{toast.description}</p> : null}
                </div>
                <button
                  aria-label="Dismiss notification"
                  className="rounded-md p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
                  onClick={() => dismiss(toast.id)}
                  type="button"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
