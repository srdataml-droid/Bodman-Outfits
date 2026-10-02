import { redirect } from "next/navigation";

export default function CustomRequestPage(): never {
  redirect("/appointment");
}
