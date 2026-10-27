import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/auth-forms"

export const metadata: Metadata = { title: "بازنشانی رمز عبور" }

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
