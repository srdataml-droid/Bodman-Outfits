import { redirect } from "next/navigation";

export default function AdminIndexPage(): never {
  redirect("/admin/requests");
}
