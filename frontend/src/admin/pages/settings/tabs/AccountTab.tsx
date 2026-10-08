import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Field } from "../../../components/ui";
import { MediaPickerModal } from "../../../components/MediaPickerModal";
import { AdminThemeToggle } from "../../../components/AdminThemeToggle";

export function AccountTab() {
  const queryClient = useQueryClient();

  // Profile Form States
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings", "account"],
    queryFn: () => api.get<{ profile: any }>("/admin/settings/account/profile"),
  });

  const profile = data?.profile;

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setUsername(profile.username || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setAvatar(profile.avatar || "");
    }
  }, [profile]);

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/account/profile", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "account"] });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3500);
    },
  });

  // Password Change Mutation
  const changePasswordMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/account/password", body),
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    },
    onError: (err: any) => {
      setPasswordError(err?.message || "Failed to update password");
    },
  });

  // Password Strength Calculation
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNum = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

  const passedRules = [hasMinLen, hasUpper, hasLower, hasNum, hasSpecial].filter(Boolean).length;
  const strengthLevels = ["Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthText = newPassword ? strengthLevels[passedRules] : "";
  const strengthColors = ["bg-rose-500", "bg-rose-500", "bg-amber-500", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading account profile…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Personal Profile Details (2 cols) */}
        <div className="space-y-6 lg:col-span-2 min-w-0">
          <Card title="Admin Profile Information">
            {profileSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
                ✓ Account profile updated successfully.
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate({ name, username, phone, avatar });
              }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4 pb-2">
                <img
                  src={avatar || "/dr-alka-chopra-madan.png"}
                  alt={name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-[var(--admin-accent)] shadow-md flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <Field
                    label="Profile Image Avatar"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://... or choose from media library"
                  />
                  <div className="flex items-center gap-2 -mt-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setMediaPickerOpen(true)}
                    >
                      📁 Choose from Library
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                      onClick={() => setMediaPickerOpen(true)}
                    >
                      ⬆️ Upload from Browser
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Profile Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                />
                <Field
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin_username"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="min-h-[44px] w-full rounded-xl border border-[var(--admin-border)] bg-black/30 px-3.5 text-[0.9rem] text-[var(--admin-text-muted)] cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-400 border border-emerald-500/30">
                      ✓ Verified
                    </span>
                  </div>
                  <p className="mt-1 text-[0.75rem] text-[var(--admin-text-muted)]">
                    Primary administrative address for credentials & OTPs
                  </p>
                </div>

                <Field
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={updateProfileMutation.isPending || !name}
                >
                  {updateProfileMutation.isPending ? "Saving Profile…" : "Update Profile"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password Card */}
          <Card title="Security & Password Change">
            {passwordSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
                ✓ Password updated successfully! All other active sessions have been securely revoked.
              </div>
            )}
            {passwordError && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
                {passwordError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPasswordError("");
                changePasswordMutation.mutate({ currentPassword, newPassword, confirmPassword });
              }}
              className="space-y-4"
            >
              {/* Current Password */}
              <div>
                <label className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="min-h-[44px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 pr-10 text-[0.9rem] text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-3 text-xs text-[var(--admin-text-muted)] hover:text-white"
                  >
                    {showCurrent ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter strong new password"
                    required
                    className="min-h-[44px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 pr-10 text-[0.9rem] text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-3 text-xs text-[var(--admin-text-muted)] hover:text-white"
                  >
                    {showNew ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--admin-text-muted)]">Strength:</span>
                      <span className="font-semibold text-[var(--admin-text-primary)]">{strengthText}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthColors[passedRules]}`}
                        style={{ width: `${(passedRules / 5) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[0.7rem] text-[var(--admin-text-muted)]">
                      <span className={hasMinLen ? "text-emerald-400 font-medium" : ""}>✓ 8+ Characters</span>
                      <span className={hasUpper ? "text-emerald-400 font-medium" : ""}>✓ Uppercase (A-Z)</span>
                      <span className={hasLower ? "text-emerald-400 font-medium" : ""}>✓ Lowercase (a-z)</span>
                      <span className={hasNum ? "text-emerald-400 font-medium" : ""}>✓ Numbers (0-9)</span>
                      <span className={hasSpecial ? "text-emerald-400 font-medium" : ""}>✓ Special Character</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    required
                    className="min-h-[44px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 pr-10 text-[0.9rem] text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 text-xs text-[var(--admin-text-muted)] hover:text-white"
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                >
                  {changePasswordMutation.isPending ? "Changing Password…" : "Update Password"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Account Status & Diagnostics (1 col) - Sticky */}
        <div className="space-y-6 min-w-0 admin-sticky-sidebar">
          <Card title="Account Overview">
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[var(--admin-text-muted)] block">Assigned Role:</span>
                <span className="font-semibold text-[var(--admin-accent)] text-sm uppercase tracking-wide">
                  {profile?.role?.replace(/_/g, " ") || "ADMINISTRATOR"}
                </span>
              </div>

              <div className="border-t border-[var(--admin-border)]/40 pt-3">
                <span className="text-[var(--admin-text-muted)] block">Account Status:</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-emerald-400 font-semibold mt-1">
                  ● ACTIVE
                </span>
              </div>

              <div className="border-t border-[var(--admin-border)]/40 pt-3">
                <span className="text-[var(--admin-text-muted)] block">Email Verification:</span>
                <span className="font-medium text-[var(--admin-text-primary)]">Verified & Confirmed</span>
              </div>

              <div className="border-t border-[var(--admin-border)]/40 pt-3">
                <span className="text-[var(--admin-text-muted)] block">Last Password Change:</span>
                <span className="font-mono text-[var(--admin-text-primary)]">
                  {profile?.lastPasswordChange
                    ? new Date(profile.lastPasswordChange).toLocaleString()
                    : "Initial Setup"}
                </span>
              </div>

              <div className="border-t border-[var(--admin-border)]/40 pt-3">
                <span className="text-[var(--admin-text-muted)] block">Last Login Timestamp:</span>
                <span className="font-mono text-[var(--admin-text-primary)]">
                  {profile?.lastLogin
                    ? new Date(profile.lastLogin).toLocaleString()
                    : new Date().toLocaleString()}
                </span>
              </div>

              <div className="border-t border-[var(--admin-border)]/40 pt-3">
                <span className="text-[var(--admin-text-muted)] block">Two-Factor Authentication:</span>
                <span className="font-semibold text-amber-300">
                  {profile?.twoFactorEnabled ? "ENABLED ✓" : "DISABLED (Setup in Security)"}
                </span>
              </div>
            </div>
          </Card>

          {/* Theme & Display Customization */}
          <Card title="Appearance & Theme">
            <div className="space-y-3.5 text-xs">
              <p className="text-[var(--admin-text-muted)] leading-relaxed">
                Choose your preferred admin visual theme. Mode selection is saved directly to your browser session.
              </p>
              <div className="pt-2 border-t border-[var(--admin-border)]/40 flex items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-[var(--admin-text-primary)] block text-xs">
                    Interface Mode
                  </span>
                  <span className="text-[0.68rem] text-[var(--admin-accent)]">
                    Cosmic Night / Warm Vellum
                  </span>
                </div>
                <AdminThemeToggle variant="switch" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        title="Select Profile Avatar"
        currentValue={avatar}
        onSelect={(url) => setAvatar(url)}
      />
    </div>
  );
}
