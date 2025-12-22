"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { X } from "lucide-react"

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "warning" | "info"
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: "success" | "error" | "warning" | "info") => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

function ToastNotification({ id, message, type, onClose }: Toast & { onClose: () => void }) {
  const colors = {
    success: "bg-secondary text-white",
    error: "bg-destructive text-white",
    warning: "bg-orange-500 text-white",
    info: "bg-primary text-white",
  }

  return (
    <div className={`${colors[type]} rounded-lg p-4 flex items-center justify-between gap-4 shadow-lg min-w-64`}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="hover:bg-black/10 rounded p-1">
        <X size={16} />
      </button>
    </div>
  )
}
