"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useDB } from "@/lib/store"
import { isOverdue } from "@/lib/invoice-helpers"
import { initials } from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { isActive, mainNav, secondaryNav } from "./nav"

export function AppSidebar() {
  const pathname = usePathname()
  const db = useDB()
  const { setOpenMobile } = useSidebar()
  const { t, dir } = useT()
  const overdue = db ? db.invoices.filter((i) => isOverdue(i)).length : 0
  const business = db?.settings.business
  const closeMobile = () => setOpenMobile(false)

  return (
    <Sidebar collapsible="icon" side={dir === "rtl" ? "right" : "left"}>
      <SidebarHeader className="gap-3 px-3 pt-4">
        <Link href="/dashboard" onClick={closeMobile} className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:px-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <BrandMark className="size-5" />
          </div>
          <span className="text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">{t("Belami")}</span>
        </Link>
        <Button asChild size="sm" className="w-full group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0">
          <Link href="/invoices/new" onClick={closeMobile}>
            <Plus />
            <span className="group-data-[collapsible=icon]:hidden">{t("New invoice")}</span>
          </Link>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(pathname, item.href)} tooltip={t(item.name)}>
                    <Link href={item.href} onClick={closeMobile}>
                      <item.icon />
                      <span>{t(item.name)}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.href === "/invoices" && overdue > 0 && (
                    <SidebarMenuBadge className="bg-danger-soft text-danger-text">{overdue}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(pathname, item.href)} tooltip={t(item.name)}>
                    <Link href={item.href} onClick={closeMobile}>
                      <item.icon />
                      <span>{t(item.name)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <Link
          href="/settings"
          onClick={closeMobile}
          className="flex items-center gap-2.5 rounded-md p-1.5 hover:bg-sidebar-accent group-data-[collapsible=icon]:p-0"
        >
          {business?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo} alt="" className="size-8 shrink-0 rounded-md border bg-white object-contain" />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-xs font-semibold">
              {initials(business?.name ?? "B")}
            </span>
          )}
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-medium">{business?.name ?? "Your business"}</span>
            <span className="block truncate text-xs text-muted-foreground">{t("Demo workspace")}</span>
          </span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
