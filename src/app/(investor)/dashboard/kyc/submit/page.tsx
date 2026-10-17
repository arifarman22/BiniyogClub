import { redirect } from "next/navigation";

// KYC is no longer a separate step — identity details are collected at signup.
export default function KycSubmitPage() {
  redirect("/dashboard/profile");
}
