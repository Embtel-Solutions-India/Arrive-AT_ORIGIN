import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Field, Modal } from "../../../components/ui";
import { Toggle } from "../components/Toggle";
import { ConfirmationModal } from "../components/ConfirmationModal";


export function SecurityTab() {
  const queryClient = useQueryClient();

  // Password Policy State
  const [minLength, setMinLength] = useState(8);
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireLowercase, setRequireLowercase] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [expirationDays, setExpirationDays] = useState(90);
  const [preventPasswordReuseCount, setPreventPasswordReuseCount] = useState(5);

  // Login Security State
  const [enableCaptcha, setEnableCaptcha] = useState(false);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [lockoutDurationMinutes, setLockoutDurationMinutes] = useState(15);
  const [blockSuspiciousLogin, setBlockSuspiciousLogin] = useState(true);
  const [loginNotification, setLoginNotification] = useState(true);
  const [failedLoginNotification, setFailedLoginNotification] = useState(true);

  // Two-Factor Authentication State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [requireForAdmins, setRequireForAdmins] = useState(false);
  const [requireForSuperAdmin, setRequireForSuperAdmin] = useState(false);

  // Backup codes modal
  const [backupCodesModalOpen, setBackupCodesModalOpen] = useState(false);
  const [regenPasswordModalOpen, setRegenPasswordModalOpen] = useState(false);
  const [reset2FAModalOpen, setReset2FAModalOpen] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Real 2FA Status Query
  const { data: twoFactorStatus, refetch: refetch2FA } = useQuery({
    queryKey: ["admin", "settings", "2fa"],
    queryFn: () =>
      api.get<{ enabled: boolean; enrolledAt?: string; remainingBackupCodes: number }>(
        "/admin/settings/2fa/status"
      ),
  });


  // Query Settings
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: any }>("/admin/settings"),
  });

  const sec = data?.settings?.security;

  useEffect(() => {
    if (sec) {
      if (sec.passwordPolicy) {
        setMinLength(sec.passwordPolicy.minLength ?? 8);
        setRequireUppercase(sec.passwordPolicy.requireUppercase ?? true);
        setRequireLowercase(sec.passwordPolicy.requireLowercase ?? true);
        setRequireNumber(sec.passwordPolicy.requireNumber ?? true);
        setRequireSpecialChar(sec.passwordPolicy.requireSpecialChar ?? true);
        setExpirationDays(sec.passwordPolicy.expirationDays ?? 90);
        setPreventPasswordReuseCount(sec.passwordPolicy.preventPasswordReuseCount ?? 5);
      }
      if (sec.loginSecurity) {
        setEnableCaptcha(sec.loginSecurity.enableCaptcha ?? false);
        setMaxLoginAttempts(sec.loginSecurity.maxLoginAttempts ?? 5);
        setLockoutDurationMinutes(sec.loginSecurity.lockoutDurationMinutes ?? 15);
        setBlockSuspiciousLogin(sec.loginSecurity.blockSuspiciousLogin ?? true);
        setLoginNotification(sec.loginSecurity.loginNotification ?? true);
        setFailedLoginNotification(sec.loginSecurity.failedLoginNotification ?? true);
      }
      if (sec.twoFactor) {
        setTwoFactorEnabled(sec.twoFactor.enabled ?? false);
        setRequireForAdmins(sec.twoFactor.requireForAdmins ?? false);
        setRequireForSuperAdmin(sec.twoFactor.requireForSuperAdmin ?? false);
      }
    }
  }, [sec]);

  // Mutation
  const saveMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/security", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setSavedSuccess(true);
      setErrorMessage("");
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || "Failed to update security settings");
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      passwordPolicy: {
        minLength: Number(minLength),
        requireUppercase,
        requireLowercase,
        requireNumber,
        requireSpecialChar,
        expirationDays: Number(expirationDays),
        preventPasswordReuseCount: Number(preventPasswordReuseCount),
      },
      loginSecurity: {
        enableCaptcha,
        maxLoginAttempts: Number(maxLoginAttempts),
        lockoutDurationMinutes: Number(lockoutDurationMinutes),
        blockSuspiciousLogin,
        loginNotification,
        failedLoginNotification,
      },
      twoFactor: {
        enabled: twoFactorEnabled,
        requireForAdmins,
        requireForSuperAdmin,
      },
    });
  };

  const handleGenerateBackupCodes = () => {
    const chars = "0123456789ABCDEF";
    const newCodes: string[] = [];
    for (let i = 0; i < 6; i++) {
      let code = "";
      for (let j = 0; j < 12; j++) {
        if (j > 0 && j % 4 === 0) code += "-";
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      newCodes.push(code);
    }
    setBackupCodes(newCodes);
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-[var(--admin-text-muted)]">Loading security configuration…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Save / Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)]/60 pb-5">
        <div>
          <h2 className="text-xl font-display font-medium text-[var(--admin-text-primary)]">
            Security & Authentication Policy
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Configure enterprise password requirements, brute-force defense rules, and two-factor authentication.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="text-xs"
          >
            {saveMutation.isPending ? "Saving Changes…" : savedSuccess ? "✓ Changes Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-300">
          ✓ Security policies updated successfully across the admin portal.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Password Security */}
        <Card title="Password Security Policy">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="Minimum Password Length"
                type="number"
                min={6}
                max={32}
                value={minLength}
                onChange={(e) => setMinLength(Math.max(6, parseInt(e.target.value) || 8))}
                helperText="Recommended: at least 8-12 characters"
              />
              <Field
                label="Password Expiration (Days)"
                type="number"
                min={0}
                max={365}
                value={expirationDays}
                onChange={(e) => setExpirationDays(parseInt(e.target.value) || 0)}
                helperText="Set to 0 to disable periodic expiration"
              />
            </div>

            <Field
              label="Prevent Previous Password Reuse (Count)"
              type="number"
              min={0}
              max={10}
              value={preventPasswordReuseCount}
              onChange={(e) => setPreventPasswordReuseCount(parseInt(e.target.value) || 0)}
              helperText="Number of previous passwords remembered by system"
            />

            <div className="divide-y divide-[var(--admin-border)]/40 pt-2">
              <Toggle
                label="Require Uppercase Letter (A-Z)"
                description="Requires at least one uppercase alphabetic character."
                checked={requireUppercase}
                onChange={setRequireUppercase}
              />
              <Toggle
                label="Require Lowercase Letter (a-z)"
                description="Requires at least one lowercase alphabetic character."
                checked={requireLowercase}
                onChange={setRequireLowercase}
              />
              <Toggle
                label="Require Number (0-9)"
                description="Requires at least one numeric digit."
                checked={requireNumber}
                onChange={setRequireNumber}
              />
              <Toggle
                label="Require Special Character (!@#$%...)"
                description="Requires at least one non-alphanumeric special symbol."
                checked={requireSpecialChar}
                onChange={setRequireSpecialChar}
              />
            </div>
          </div>
        </Card>

        {/* 2. Login Security & Brute-Force Protection */}
        <Card title="Login Security & Rate Limiting">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="Maximum Login Attempts"
                type="number"
                min={3}
                max={20}
                value={maxLoginAttempts}
                onChange={(e) => setMaxLoginAttempts(Math.max(3, parseInt(e.target.value) || 5))}
                helperText="Allowed failed attempts before temporary lockout"
              />
              <Field
                label="Lockout Duration (Minutes)"
                type="number"
                min={1}
                max={1440}
                value={lockoutDurationMinutes}
                onChange={(e) => setLockoutDurationMinutes(Math.max(1, parseInt(e.target.value) || 15))}
                helperText="Duration an account stays locked after limits"
              />
            </div>

            <div className="divide-y divide-[var(--admin-border)]/40 pt-2">
              <Toggle
                label="Enable CAPTCHA on Login"
                description="Triggers bot challenges upon detecting repeated suspicious attempts."
                checked={enableCaptcha}
                onChange={setEnableCaptcha}
              />
              <Toggle
                label="Block Suspicious Login Patterns"
                description="Automatically flags logins from unrecognized geos or fast-hopping IPs."
                checked={blockSuspiciousLogin}
                onChange={setBlockSuspiciousLogin}
              />
              <Toggle
                label="Admin Login Email Notification"
                description="Sends notification to account email whenever an admin logs in."
                checked={loginNotification}
                onChange={setLoginNotification}
              />
              <Toggle
                label="Failed Login Alert Notification"
                description="Sends alert when 3 consecutive bad passwords are typed."
                checked={failedLoginNotification}
                onChange={setFailedLoginNotification}
              />
            </div>
          </div>
        </Card>

        {/* 3. Two-Factor Authentication (2FA) */}
        <Card title="Two-Factor Authentication (2FA)" className="lg:col-span-2">
          <div className="space-y-5">
            {/* Live 2FA Status Banner */}
            <div className="rounded-2xl border border-[var(--admin-border)]/80 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Your Account 2FA Status:</span>
                  {twoFactorStatus?.enabled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      ACTIVE & ENROLLED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      NOT ENROLLED (Setup on Login)
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--admin-text-secondary)]">
                  {twoFactorStatus?.enabled ? (
                    <>
                      Linked with Google / Microsoft Authenticator.{" "}
                      <span className="text-white font-medium">
                        {twoFactorStatus.remainingBackupCodes} of 10
                      </span>{" "}
                      emergency backup codes remaining.
                    </>
                  ) : (
                    "Every administrator account must complete 2FA setup with Google or Microsoft Authenticator before accessing the portal."
                  )}
                </p>
              </div>

              {twoFactorStatus?.enabled && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRegenPasswordModalOpen(true)}
                    className="text-xs"
                  >
                    Regenerate Backup Codes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReset2FAModalOpen(true)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Reset 2FA
                  </Button>
                </div>
              )}
            </div>

            <div className="divide-y divide-[var(--admin-border)]/40">
              <Toggle
                label="Enable Two-Factor Authentication Portal-wide"
                description="Enforce 2FA verification across all administrative roles."
                checked={twoFactorEnabled}
                onChange={setTwoFactorEnabled}
                badge={twoFactorEnabled ? "ENABLED" : "DISABLED"}
              />
              <Toggle
                label="Require 2FA for all Administrators"
                description="Mandates 2FA registration before allowing access to administrative tabs."
                checked={requireForAdmins}
                onChange={setRequireForAdmins}
              />
              <Toggle
                label="Require 2FA for Super Admin"
                description="Strictly forces 2FA for Super Admin accounts to safeguard root settings."
                checked={requireForSuperAdmin}
                onChange={setRequireForSuperAdmin}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Password Confirmation to Regenerate Backup Codes */}
      <ConfirmationModal
        open={regenPasswordModalOpen}
        onClose={() => setRegenPasswordModalOpen(false)}
        onConfirm={async (pwd) => {
          if (!pwd) return;
          setIsRegenerating(true);
          try {
            const res = await api.post<{ backupCodes: string[] }>("/admin/settings/2fa/recovery-codes", {
              password: pwd,
            });
            setBackupCodes(res.backupCodes);
            setBackupCodesModalOpen(true);
            refetch2FA();
          } finally {
            setIsRegenerating(false);
          }
        }}
        title="Regenerate Emergency Backup Codes"
        description="Generating new codes will invalidate all existing unused recovery codes. Enter your current password to proceed."
        confirmText="Generate New Codes"
        confirmVariant="primary"
        requirePassword={true}
        isLoading={isRegenerating}
      />

      {/* Password Confirmation to Reset 2FA */}
      <ConfirmationModal
        open={reset2FAModalOpen}
        onClose={() => setReset2FAModalOpen(false)}
        onConfirm={async (pwd) => {
          if (!pwd) return;
          await api.post("/admin/settings/2fa/disable", { password: pwd });
          refetch2FA();
          queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
        }}
        title="Reset Two-Factor Authentication"
        description="Are you sure you want to reset 2FA? You will be prompted to re-enroll your authenticator app upon your next login. Enter your password to confirm."
        confirmText="Reset 2FA"
        confirmVariant="danger"
        requirePassword={true}
      />

      {/* Backup Codes Display Modal */}
      <Modal
        open={backupCodesModalOpen}
        onClose={() => setBackupCodesModalOpen(false)}
        title="New Emergency Backup Codes"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--admin-text-secondary)]">
            Store these one-time codes in a safe place. Each code can only be used once if you lose access to your authenticator app.
          </p>

          <div className="grid grid-cols-2 gap-2 bg-[var(--admin-background)] p-4 rounded-xl border border-[var(--admin-border)]">
            {backupCodes.map((code, idx) => (
              <div
                key={idx}
                className="font-mono text-xs text-[var(--admin-accent)] font-semibold p-1.5 bg-white/[0.03] rounded border border-white/5 text-center select-all"
              >
                {code}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--admin-border)]/50 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(backupCodes.join("\n"));
                setCopiedCodes(true);
                setTimeout(() => setCopiedCodes(false), 2500);
              }}
              className="text-xs"
            >
              {copiedCodes ? "Copied!" : "Copy All"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const text =
                  `Soul Body Healing Center - 2FA Emergency Backup Codes\n` +
                  `Generated: ${new Date().toLocaleString()}\n\n` +
                  backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n");
                const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "admin-2fa-backup-codes.txt";
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }}
              className="text-xs"
            >
              Download (.txt)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setBackupCodesModalOpen(false)}
              className="text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

