import { redirect } from "next/navigation";

// KYC is no longer a separate step — identity details are collected at signup.
// Old links (notifications, bookmarks) land on the profile page instead.
export default function KycPage() {
  redirect("/dashboard/profile");
}
