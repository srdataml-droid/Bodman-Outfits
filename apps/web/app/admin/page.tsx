import { redirect } from "next/navigation";

// Appointments is the landing screen because it is the time-sensitive one:
// an unanswered booking request ages badly in a way an unread FAQ edit does
// not.
export default function AdminIndexPage(): never {
  redirect("/admin/appointments");
}
