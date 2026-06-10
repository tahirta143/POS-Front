import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { MdDeleteOutline, MdClose } from "react-icons/md";

let resolvePendingConfirm = null;

export function confirmAction({
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = "danger",
} = {}) {
  return new Promise((resolve) => {
    resolvePendingConfirm = resolve;
    window.dispatchEvent(
      new CustomEvent("confirm-dialog:open", {
        detail: { title, message, confirmLabel, cancelLabel, type },
      }),
    );
  });
}

export function ConfirmDialogProvider() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: "Confirm action",
    message: "Are you sure you want to continue?",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    type: "danger",
  });

  useEffect(() => {
    const handler = (event) => {
      setConfig({
        title: "Confirm action",
        message: "Are you sure you want to continue?",
        confirmLabel: "Confirm",
        cancelLabel: "Cancel",
        type: "danger",
        ...event.detail,
      });
      setIsOpen(true);
    };

    window.addEventListener("confirm-dialog:open", handler);
    return () => window.removeEventListener("confirm-dialog:open", handler);
  }, []);

  const closeDialog = (value) => {
    setIsOpen(false);
    if (resolvePendingConfirm) {
      resolvePendingConfirm(value);
      resolvePendingConfirm = null;
    }
  };

  if (!isOpen) return null;

  const isDanger = config.type === "danger";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                isDanger
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                  : "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
              }`}
            >
              {isDanger ? <MdDeleteOutline className="h-6 w-6" /> : <MdDeleteOutline className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {config.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {config.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => closeDialog(false)}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => closeDialog(false)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {config.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => closeDialog(true)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {config.confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
