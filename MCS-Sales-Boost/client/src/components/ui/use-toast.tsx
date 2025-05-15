import React, { createContext, useContext, useState } from "react";
import { X } from "lucide-react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-md shadow-md flex items-start gap-3 transition-all duration-300 ease-in-out ${
              toast.variant === "destructive"
                ? "bg-red-100 text-red-900 border border-red-200"
                : "bg-white text-gray-900 border border-gray-200"
            }`}
          >
            <div className="flex-1">
              <h3 className="font-medium">{toast.title}</h3>
              {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-500 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export const toast = (props: Omit<Toast, "id">) => {
  // This is a workaround for using toast outside of React components
  // In a real app, you'd use a more robust solution
  const event = new CustomEvent("toast", { detail: props });
  window.dispatchEvent(event);
};

// Add a global event listener to handle toast events
if (typeof window !== "undefined") {
  window.addEventListener("toast", ((e: CustomEvent) => {
    const toastContainer = document.querySelector("[data-toast-container]");
    if (toastContainer) {
      const toast = document.createElement("div");
      toast.className = `p-4 rounded-md shadow-md flex items-start gap-3 transition-all duration-300 ease-in-out ${
        e.detail.variant === "destructive"
          ? "bg-red-100 text-red-900 border border-red-200"
          : "bg-white text-gray-900 border border-gray-200"
      }`;
      
      toast.innerHTML = `
        <div class="flex-1">
          <h3 class="font-medium">${e.detail.title}</h3>
          ${e.detail.description ? `<p class="text-sm mt-1">${e.detail.description}</p>` : ""}
        </div>
        <button class="text-gray-500 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
      
      toastContainer.appendChild(toast);
      
      // Add click event to close button
      const closeButton = toast.querySelector("button");
      if (closeButton) {
        closeButton.addEventListener("click", () => {
          toast.remove();
        });
      }
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        toast.remove();
      }, 5000);
    }
  }) as EventListener);
}
