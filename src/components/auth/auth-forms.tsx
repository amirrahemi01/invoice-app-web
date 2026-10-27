"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Field } from "@/components/shared/field"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"

// Frontend-only screens. Real authentication arrives with the backend; for
// now submitting simply opens the demo workspace.

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function DemoNote() {
  const { t } = useT()
  return (
    <p className="mt-6 rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
      {t("Demo mode: no account is needed yet. Submitting opens the sample workspace.")}
    </p>
  )
}

function PasswordInput({ id, value, onChange, invalid, autoComplete }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean; autoComplete: string }) {
  const { t } = useT()
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} autoComplete={autoComplete} className="pe-10" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={show ? t("Hide password") : t("Show password")}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export function LoginForm() {
  const { t } = useT()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const errors = { email: !emailOk(email) ? t("Enter a valid email") : undefined, password: !password ? t("Enter your password") : undefined }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
        if (errors.email || errors.password) return
        toast.success(t("Welcome back!"))
        router.push("/dashboard")
      }}
    >
      <h1 className="text-2xl font-semibold tracking-tight">{t("Sign in")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("Welcome back. Enter your details to continue.")}</p>
      <div className="mt-6 grid gap-4">
        <Field label={t("Email")} htmlFor="email" error={submitted ? errors.email : undefined}>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={(submitted && !!errors.email) || undefined} />
        </Field>
        <Field
          label={
            <span className="flex w-full items-center justify-between">
              {t("Password")}
              <Link href="/auth/forgot-password" className="text-xs font-normal text-primary hover:underline">
                {t("Forgot password?")}
              </Link>
            </span>
          }
          htmlFor="password"
          error={submitted ? errors.password : undefined}
        >
          <PasswordInput id="password" value={password} onChange={setPassword} invalid={submitted && !!errors.password} autoComplete="current-password" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox defaultChecked /> {t("Keep me signed in")}
        </label>
        <Button type="submit" className="w-full">
          {t("Sign in")}
        </Button>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("New here?")}{" "}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          {t("Create an account")}
        </Link>
      </p>
      <DemoNote />
    </form>
  )
}

function strength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(4, score)
}

export function RegisterForm() {
  const { t } = useT()
  const router = useRouter()
  const [values, setValues] = useState({ business: "", name: "", email: "", password: "" })
  const [agree, setAgree] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const set = (k: keyof typeof values, v: string) => setValues((s) => ({ ...s, [k]: v }))
  const score = strength(values.password)
  const errors = {
    business: !values.business.trim() ? t("Enter your business name") : undefined,
    name: !values.name.trim() ? t("Enter your name") : undefined,
    email: !emailOk(values.email) ? t("Enter a valid email") : undefined,
    password: values.password.length < 8 ? t("Use at least 8 characters") : undefined,
    agree: !agree ? t("Please accept the terms") : undefined,
  }
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : undefined)

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
        if (Object.values(errors).some(Boolean)) return
        toast.success(t("Your workspace is ready"))
        router.push("/dashboard")
      }}
    >
      <h1 className="text-2xl font-semibold tracking-tight">{t("Create your account")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("Start sending professional invoices today.")}</p>
      <div className="mt-6 grid gap-4">
        <Field label={t("Business name")} htmlFor="business" error={show("business")}>
          <Input id="business" autoComplete="organization" value={values.business} onChange={(e) => set("business", e.target.value)} aria-invalid={!!show("business") || undefined} />
        </Field>
        <Field label={t("Your name")} htmlFor="name" error={show("name")}>
          <Input id="name" autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!show("name") || undefined} />
        </Field>
        <Field label={t("Work email")} htmlFor="email" error={show("email")}>
          <Input id="email" type="email" autoComplete="email" value={values.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!show("email") || undefined} />
        </Field>
        <Field label={t("Password")} htmlFor="password" error={show("password")}>
          <PasswordInput id="password" value={values.password} onChange={(v) => set("password", v)} invalid={!!show("password")} autoComplete="new-password" />
          <div className="mt-1 grid grid-cols-4 gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("h-1 rounded-full", i < score ? (score <= 1 ? "bg-destructive" : score <= 2 ? "bg-warning" : "bg-success") : "bg-muted")} />
            ))}
          </div>
        </Field>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox className="mt-0.5" checked={agree} onCheckedChange={(v) => setAgree(v === true)} aria-invalid={!!show("agree") || undefined} />
          <span className={cn(show("agree") && "text-destructive")}>{t("I agree to the Terms of Service and Privacy Policy")}</span>
        </label>
        <Button type="submit" className="w-full">
          {t("Create account")}
        </Button>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("Already have an account?")}{" "}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          {t("Sign in")}
        </Link>
      </p>
      <DemoNote />
    </form>
  )
}

export function ForgotPasswordForm() {
  const { t } = useT()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const error = !emailOk(email) ? t("Enter a valid email") : undefined

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-soft">
          <MailCheck className="size-6 text-success-text" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{t("Check your email")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("If an account exists for {email}, you'll get a link to reset your password.", { email })}
        </p>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href="/auth/login">
            <ArrowLeft className="rtl:rotate-180" /> {t("Back to sign in")}
          </Link>
        </Button>
        <DemoNote />
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
        if (!error) setSent(true)
      }}
    >
      <h1 className="text-2xl font-semibold tracking-tight">{t("Reset your password")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("Enter your email and we'll send you a reset link.")}</p>
      <div className="mt-6 grid gap-4">
        <Field label={t("Email")} htmlFor="email" error={submitted ? error : undefined}>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={(submitted && !!error) || undefined} />
        </Field>
        <Button type="submit" className="w-full">
          {t("Send reset link")}
        </Button>
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/auth/login" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4 rtl:rotate-180" /> {t("Back to sign in")}
        </Link>
      </p>
      <DemoNote />
    </form>
  )
}
