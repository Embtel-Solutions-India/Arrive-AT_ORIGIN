import { useState } from "react";
import { Button, Modal } from "../../../components/ui";

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: "danger" | "primary";
  requiredPhrase?: string;
  requirePassword?: boolean;
  isLoading?: boolean;
}

export function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm Action",
  confirmVariant = "danger",
  requiredPhrase,
  requirePassword = false,
  isLoading = false,
}: ConfirmationModalProps) {
  const [typedPhrase, setTypedPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setTypedPhrase("");
    setPassword("");
    setError("");
    onClose();
  };

  const handleProceed = async () => {
    if (requiredPhrase && typedPhrase.trim() !== requiredPhrase) {
      setError(`Please type the exact confirmation phrase: "${requiredPhrase}"`);
      return;
    }
    if (requirePassword && !password) {
      setError("Admin password is required to proceed with this critical action.");
      return;
    }
    try {
      setError("");
      await onConfirm(password);
      handleClose();
    } catch (err: any) {
      setError(err?.message || "Action failed. Please verify credentials.");
    }
  };

  const isButtonDisabled =
    isLoading ||
    (Boolean(requiredPhrase) && typedPhrase.trim() !== requiredPhrase) ||
    (requirePassword && !password);

  return (
    <Modal open={open} onClose={handleClose} title={title} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 leading-relaxed">
          <strong className="block text-sm font-semibold text-rose-200 mb-1">⚠️ Critical Operation Warning</strong>
          {description}
        </div>

        {requiredPhrase && (
          <div>
            <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1.5">
              Type the confirmation phrase below to proceed:
            </label>
            <div className="p-2 mb-2 font-mono text-xs bg-[var(--admin-background)] border border-[var(--admin-border)] rounded-lg text-amber-300 select-all">
              {requiredPhrase}
            </div>
            <input
              type="text"
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder="Type confirmation phrase here..."
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 py-2.5 text-sm text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)] font-mono"
            />
          </div>
        )}

        {requirePassword && (
          <div>
            <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1.5">
              Admin Password Verification *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your current admin password"
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 py-2.5 text-sm text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]"
            />
          </div>
        )}

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--admin-border)]/50">
          <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="sm"
            onClick={handleProceed}
            disabled={isButtonDisabled}
          >
            {isLoading ? "Verifying & Executing…" : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
