"use client";

import { adminApi, ENQUIRY_STATUSES, type Enquiry, type EnquiryStatus } from "../../../lib/admin-api";
import { formatDateTime, RecordScreen } from "../../../components/admin/record-screen";

export default function EnquiriesPage(): React.ReactElement {
  return (
    <RecordScreen<Enquiry>
      title="Enquiries"
      description="Messages from the contact page, newest first. Marking one replied records that you have answered it; it does not send anything."
      emptyMessage="No enquiries yet."
      statuses={ENQUIRY_STATUSES}
      load={adminApi.enquiries}
      setStatus={(id, status) => adminApi.setEnquiryStatus(id, status as EnquiryStatus)}
      columns={[
        { header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { header: "Subject", render: (r) => <span className="capitalize">{r.subject.replace("-", " ")}</span> },
        { header: "Received", render: (r) => formatDateTime(r.createdAt), secondary: true },
      ]}
      fields={[
        { label: "Name", render: (r) => r.name },
        { label: "Email", render: (r) => <a className="underline" href={`mailto:${r.email}`}>{r.email}</a> },
        { label: "Phone", render: (r) => (r.phone ? <a className="underline" href={`tel:${r.phone}`}>{r.phone}</a> : "Not provided") },
        { label: "Subject", render: (r) => <span className="capitalize">{r.subject.replace("-", " ")}</span> },
        { label: "Message", render: (r) => r.message },
        { label: "Received", render: (r) => formatDateTime(r.createdAt) },
      ]}
    />
  );
}
