import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/auth-forms"

export const metadata: Metadata = { title: "ورود" }

export default function LoginPage() {
  return <LoginForm />
}
