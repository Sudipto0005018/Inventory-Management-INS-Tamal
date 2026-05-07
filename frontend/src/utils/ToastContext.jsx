import { createContext, useContext, useRef } from "react";
import toast from "react-hot-toast";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const activeToastIdRef = useRef(null);

  const showToast = (renderFn, options = {}) => {
    if (activeToastIdRef.current) {
      toast.dismiss(activeToastIdRef.current);
      activeToastIdRef.current = null;
    }

    const id = toast.custom(renderFn, {
      duration: Infinity,
      ...options,
    });

    activeToastIdRef.current = id;
    return id;
  };

  const dismissToast = () => {
    if (activeToastIdRef.current) {
      toast.dismiss(activeToastIdRef.current);
      activeToastIdRef.current = null;
    }
  };

  const hasActiveToast = () => !!activeToastIdRef.current;

  return (
    <ToastContext.Provider
      value={{
        showToast,
        dismissToast,
        hasActiveToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToastManager = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToastManager must be used inside ToastProvider");
  }
  return ctx;
};
