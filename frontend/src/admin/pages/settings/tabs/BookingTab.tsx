import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Field, Select } from "../../../components/ui";
import { Toggle } from "../components/Toggle";

const DURATION_OPTIONS = [
  { label: "15 minutes", value: "15" },
  { label: "30 minutes", value: "30" },
  { label: "45 minutes", value: "45" },
  { label: "60 minutes", value: "60" },
  { label: "Custom Duration", value: "custom" },
];

export function BookingTab() {
  const queryClient = useQueryClient();

  // State
  const [enableBookings, setEnableBookings] = useState(true);
  const [enableConsultation, setEnableConsultation] = useState(true);
  const [durationSelection, setDurationSelection] = useState("60");
  const [customDuration, setCustomDuration] = useState(60);
  const [bufferTimeMinutes, setBufferTimeMinutes] = useState(15);
  const [minBookingNoticeHours, setMinBookingNoticeHours] = useState(24);
  const [cancellationAllowed, setCancellationAllowed] = useState(true);
  const [cancellationNoticeHours, setCancellationNoticeHours] = useState(48);
  const [reschedulingAllowed, setReschedulingAllowed] = useState(true);
  const [reschedulingNoticeHours, setReschedulingNoticeHours] = useState(24);
  const [sendBookingConfirmation, setSendBookingConfirmation] = useState(true);
  const [sendAutomaticReminder, setSendAutomaticReminder] = useState(true);
  const [reminderHoursBefore, setReminderHoursBefore] = useState(24);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Query Settings
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: any }>("/admin/settings"),
  });

  const bkg = data?.settings?.booking;

  useEffect(() => {
    if (bkg) {
      setEnableBookings(bkg.enableBookings ?? true);
      setEnableConsultation(bkg.enableConsultation ?? true);

      const d = bkg.defaultDurationMinutes ?? 60;
      const match = DURATION_OPTIONS.find((opt) => opt.value === String(d));
      if (match) {
        setDurationSelection(String(d));
      } else {
        setDurationSelection("custom");
        setCustomDuration(d);
      }

      setBufferTimeMinutes(bkg.bufferTimeMinutes ?? 15);
      setMinBookingNoticeHours(bkg.minBookingNoticeHours ?? 24);
      setCancellationAllowed(bkg.cancellationAllowed ?? true);
      setCancellationNoticeHours(bkg.cancellationNoticeHours ?? 48);
      setReschedulingAllowed(bkg.reschedulingAllowed ?? true);
      setReschedulingNoticeHours(bkg.reschedulingNoticeHours ?? 24);
      setSendBookingConfirmation(bkg.sendBookingConfirmation ?? true);
      setSendAutomaticReminder(bkg.sendAutomaticReminder ?? true);
      setReminderHoursBefore(bkg.reminderHoursBefore ?? 24);
    }
  }, [bkg]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/booking", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setSavedSuccess(true);
      setErrorMessage("");
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: any) => setErrorMessage(err?.message || "Failed to update booking settings"),
  });

  const handleSave = () => {
    const finalDuration =
      durationSelection === "custom" ? Number(customDuration) : Number(durationSelection);

    saveMutation.mutate({
      enableBookings,
      enableConsultation,
      defaultDurationMinutes: finalDuration,
      bufferTimeMinutes: Number(bufferTimeMinutes),
      minBookingNoticeHours: Number(minBookingNoticeHours),
      cancellationAllowed,
      cancellationNoticeHours: Number(cancellationNoticeHours),
      reschedulingAllowed,
      reschedulingNoticeHours: Number(reschedulingNoticeHours),
      sendBookingConfirmation,
      sendAutomaticReminder,
      reminderHoursBefore: Number(reminderHoursBefore),
    });
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-[var(--admin-text-muted)]">Loading booking operational rules…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)]/60 pb-5">
        <div>
          <h2 className="text-xl font-display font-medium text-[var(--admin-text-primary)]">
            Consultation & Appointment Calendar Settings
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Configure consultation availability, buffer buffers, cancellation windows, and automated client reminders.
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
            {saveMutation.isPending ? "Saving…" : savedSuccess ? "✓ Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
          ✓ Booking & consultation parameters updated successfully.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Availability & Master Toggles */}
        <Card title="Appointment Flow Controls">
          <div className="space-y-4">
            <div className="divide-y divide-[var(--admin-border)]/40">
              <Toggle
                label="Enable Booking System"
                description="Master switch. When turned off, appointment calendar links will show as temporarily paused."
                checked={enableBookings}
                onChange={setEnableBookings}
                badge={enableBookings ? "OPEN" : "PAUSED"}
              />
              <Toggle
                label="Enable 1-on-1 Consultation Booking"
                description="Allows prospective clients to book private healing and coaching sessions."
                checked={enableConsultation}
                onChange={setEnableConsultation}
              />
            </div>

            <div className="pt-2 border-t border-[var(--admin-border)]/40">
              <Select
                label="Default Appointment Duration"
                value={durationSelection}
                onChange={(e) => setDurationSelection(e.target.value)}
                options={DURATION_OPTIONS}
              />

              {durationSelection === "custom" && (
                <Field
                  label="Custom Appointment Length (Minutes)"
                  type="number"
                  min={10}
                  max={360}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Math.max(10, parseInt(e.target.value) || 60))}
                  helperText="Length of private consultation session"
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Buffer Time Between Appointments"
                  type="number"
                  min={0}
                  max={120}
                  value={bufferTimeMinutes}
                  onChange={(e) => setBufferTimeMinutes(parseInt(e.target.value) || 0)}
                  helperText="Minutes reserved for prep and notes"
                />
                <Field
                  label="Minimum Advance Notice (Hours)"
                  type="number"
                  min={1}
                  max={168}
                  value={minBookingNoticeHours}
                  onChange={(e) => setMinBookingNoticeHours(parseInt(e.target.value) || 24)}
                  helperText="Prevents last-minute bookings"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Cancellation, Rescheduling & Automated Reminders */}
        <Card title="Policies & Automated Client Reminders">
          <div className="space-y-4">
            <div className="divide-y divide-[var(--admin-border)]/40">
              <Toggle
                label="Allow Client Cancellations"
                description="Clients can cancel their appointments via self-service portal links."
                checked={cancellationAllowed}
                onChange={setCancellationAllowed}
              />
              {cancellationAllowed && (
                <div className="py-2">
                  <Field
                    label="Cancellation Notice Window (Hours)"
                    type="number"
                    min={1}
                    max={168}
                    value={cancellationNoticeHours}
                    onChange={(e) => setCancellationNoticeHours(parseInt(e.target.value) || 48)}
                    helperText="Hours prior to start time after which cancellation is locked"
                  />
                </div>
              )}

              <Toggle
                label="Allow Appointment Rescheduling"
                description="Permit clients to pick an alternate date/time slot without re-purchasing."
                checked={reschedulingAllowed}
                onChange={setReschedulingAllowed}
              />
              {reschedulingAllowed && (
                <div className="py-2">
                  <Field
                    label="Rescheduling Notice Window (Hours)"
                    type="number"
                    min={1}
                    max={168}
                    value={reschedulingNoticeHours}
                    onChange={(e) => setReschedulingNoticeHours(parseInt(e.target.value) || 24)}
                    helperText="Hours prior to start time required to reschedule"
                  />
                </div>
              )}

              <Toggle
                label="Send Booking Confirmation Email"
                description="Immediately emails customer with calendar invite (.ics) and meeting link."
                checked={sendBookingConfirmation}
                onChange={setSendBookingConfirmation}
              />

              <Toggle
                label="Send Automatic Reminder Email"
                description="Sends automated pre-session reminder to both client and practitioner."
                checked={sendAutomaticReminder}
                onChange={setSendAutomaticReminder}
              />

              {sendAutomaticReminder && (
                <div className="py-2">
                  <Field
                    label="Reminder Schedule (Hours Before Session)"
                    type="number"
                    min={1}
                    max={72}
                    value={reminderHoursBefore}
                    onChange={(e) => setReminderHoursBefore(parseInt(e.target.value) || 24)}
                    helperText="Default: 24 hours prior to appointment start"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
