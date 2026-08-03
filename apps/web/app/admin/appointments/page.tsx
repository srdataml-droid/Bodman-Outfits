"use client";

import { adminApi, APPOINTMENT_STATUSES, type Appointment, type AppointmentStatus } from "../../../lib/admin-api";
import { formatDateTime, RecordScreen } from "../../../components/admin/record-screen";

export default function AppointmentsPage(): React.ReactElement {
  return (
    <RecordScreen<Appointment>
      title="Appointments"
      description="Fitting requests from the website, newest first. These are requests, not confirmed bookings: confirming here records your decision, it does not notify the customer. Contact them directly."
      emptyMessage="No appointment requests yet."
      statuses={APPOINTMENT_STATUSES}
      load={adminApi.appointments}
      setStatus={(id, status) => adminApi.setAppointmentStatus(id, status as AppointmentStatus)}
      columns={[
        { header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { header: "Requested for", render: (r) => `${r.preferredDate} · ${r.preferredTime}` },
        { header: "Category", render: (r) => r.category, secondary: true },
        { header: "Received", render: (r) => formatDateTime(r.createdAt), secondary: true },
      ]}
      fields={[
        { label: "Name", render: (r) => r.name },
        { label: "Phone", render: (r) => <a className="underline" href={`tel:${r.phone}`}>{r.phone}</a> },
        { label: "Email", render: (r) => (r.email ? <a className="underline" href={`mailto:${r.email}`}>{r.email}</a> : "Not provided") },
        { label: "Preferred date", render: (r) => r.preferredDate },
        { label: "Preferred time", render: (r) => <span className="capitalize">{r.preferredTime}</span> },
        { label: "Category", render: (r) => <span className="capitalize">{r.category.replace("-", " ")}</span> },
        { label: "Notes", render: (r) => r.notes ?? "None" },
        { label: "Received", render: (r) => formatDateTime(r.createdAt) },
      ]}
    />
  );
}
