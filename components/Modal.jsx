"use client";

import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKey(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="ml-4 rounded-full px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            ×
          </button>
        </header>

        <div>{children}</div>
      </div>
    </div>
  );
}
