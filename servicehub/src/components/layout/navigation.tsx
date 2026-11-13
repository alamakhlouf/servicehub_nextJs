"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Role, SafeUser } from "@/types/auth";
import { clearWorkshopParticipationDrafts } from "@/lib/pwa/workshop-participation";
import { NotificationBell } from "@/components/workshops/notification-bell";

type NavigationProps = {
  user: SafeUser | null;
};

type NavLink = {
  href: string;
  label: string;
  roles?: Role[];
};

const publicLinks: NavLink[] = [
  { href: "/", label: "Discover" },
  { href: "/services", label: "Services" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/workshops", label: "Workshops" },
];

const accountLinks: NavLink[] = [
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/bookings", label: "Bookings", roles: ["CUSTOMER", "PROVIDER"] },
  { href: "/dashboard/my-orders", label: "My orders", roles: ["CUSTOMER"] },
  { href: "/dashboard/my-reviews", label: "My reviews", roles: ["CUSTOMER"] },
  { href: "/dashboard/my-reports", label: "My reports", roles: ["CUSTOMER", "PROVIDER", "SUPPLIER", "ADMIN"] },
];

const roleLinks: Record<Role, NavLink[]> = {
  CUSTOMER: [
    { href: "/dashboard/my-participation", label: "My enrollments" },
  ],
  PROVIDER: [
    { href: "/dashboard/my-services", label: "My services" },
    { href: "/dashboard/my-workshops", label: "My workshops" },
  ],
  SUPPLIER: [
    { href: "/dashboard/my-listings", label: "My listings" },
    { href: "/dashboard/supplier-orders", label: "Supplier orders" },
  ],
  ADMIN: [
    { href: "/admin/reports", label: "Moderate reports" },
    { href: "/dashboard/my-workshops", label: "Manage workshops" },
  ],
};

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const visibleUnreadCount = user ? unreadCount : 0;
  const userId = user?.id;
  const links = user ? [...publicLinks, ...accountLinks.filter((link) => !link.roles || link.roles.includes(user.role)), ...roleLinks[user.role]] : publicLinks;
  const isActive = (href: string) => href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (!userId) {
      return;
    }
    let active = true;
    const refreshCount = async () => {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load notification count.");
        const data = (await response.json()) as { unreadCount: number };
        if (active) setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error("Unable to refresh notification count:", error);
      }
    };
    void refreshCount();
    const interval = window.setInterval(() => void refreshCount(), 30000);
    window.addEventListener("servicehub:notifications-changed", refreshCount);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("servicehub:notifications-changed", refreshCount);
    };
  }, [userId]);

  async function logout() {
    setLoggingOut(true);
    try {
      if (user) await clearWorkshopParticipationDrafts(user.id);
      try {
        const registration = await navigator.serviceWorker?.ready;
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          const response = await fetch("/api/notifications/push", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          if (!response.ok) throw new Error("Unable to remove this device's browser notification subscription.");
          await subscription.unsubscribe();
        }
      } catch (error) {
        console.error("Unable to clear browser notifications during logout:", error);
      }
      await fetch("/api/auth/logout", { method: "POST" });
      if (user) localStorage.removeItem(`servicehub_profile_snapshot:${user.id}`);
      navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_PRIVATE_CACHE" });
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-background lg:flex lg:flex-col">
        <NavigationBrand />
        <nav aria-label="Primary navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {links.map((link) => <NavigationLink active={isActive(link.href)} link={link} notificationCount={link.href === "/dashboard/notifications" ? visibleUnreadCount : undefined} onNavigate={() => undefined} key={link.href} />)}
        </nav>
        <AccountArea loggingOut={loggingOut} onLogout={() => void logout()} user={user} />
      </aside>

      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur lg:ml-64">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button aria-controls="mobile-navigation" aria-expanded={mobileOpen} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface hover:text-text lg:hidden" onClick={() => setMobileOpen((open) => !open)} type="button">
              <span aria-hidden="true" className="relative block size-4">{mobileOpen ? <><span className="absolute left-0 top-1/2 block h-px w-4 rotate-45 bg-current" /><span className="absolute left-0 top-1/2 block h-px w-4 -rotate-45 bg-current" /></> : <><span className="absolute left-0 top-1 block h-px w-4 bg-current" /><span className="absolute left-0 top-2.5 block h-px w-4 bg-current" /><span className="absolute left-0 top-4 block h-px w-4 bg-current" /></>}</span>
            </button>
            <Link className="font-display text-base font-bold tracking-tight text-text lg:hidden" href="/">
              Service<span className="text-blue-400">Hub</span>
            </Link>
            <p className="hidden text-sm text-text-muted sm:block">{user ? `Welcome back, ${user.name}` : "A clearer way to find local help."}</p>
          </div>
          {user ? <div className="flex items-center gap-3">{user.role === "CUSTOMER" ? <NotificationBell /> : null}<Avatar name={user.name} size="sm" /><span className="hidden text-sm font-semibold text-text sm:block">{user.name}</span></div> : <div className="flex items-center gap-2"><Link className="rounded-md px-3 py-2 text-sm font-semibold text-text-muted hover:text-text" href="/login">Log in</Link><Link className="inline-flex min-h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-hover sm:px-4 sm:text-sm" href="/signup">Join ServiceHub</Link></div>}
        </div>
        {mobileOpen ? <nav aria-label="Mobile navigation" className="border-t border-border px-4 py-3 sm:px-6 lg:hidden" id="mobile-navigation">{user?.role === "CUSTOMER" ? <div className="mb-3"><NotificationBell /></div> : null}{links.map((link) => <NavigationLink active={isActive(link.href)} link={link} notificationCount={link.href === "/dashboard/notifications" ? visibleUnreadCount : undefined} onNavigate={() => setMobileOpen(false)} key={link.href} />)}{user ? <div className="mt-3 border-t border-border pt-3"><AccountArea loggingOut={loggingOut} onLogout={() => void logout()} user={user} compact /></div> : null}</nav> : null}
      </header>
    </>
  );
}

function NavigationBrand() {
  return <div className="border-b border-border px-6 py-6"><Link className="font-display text-lg font-bold tracking-tight text-text" href="/">Service<span className="text-blue-400">Hub</span></Link><p className="mt-2 text-xs text-text-subtle">Local help, supplies, and skills.</p></div>;
}

function NavigationLink({ link, active, onNavigate, notificationCount = 0 }: { link: NavLink; active: boolean; onNavigate: () => void; notificationCount?: number }) {
  return <Link aria-current={active ? "page" : undefined} className={cn("flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-surface-interactive text-text" : "text-text-muted hover:bg-surface hover:text-text")} href={link.href} onClick={onNavigate}><span>{link.label}</span>{notificationCount > 0 ? <span aria-label={`${notificationCount} unread`} className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">{notificationCount > 99 ? "99+" : notificationCount}</span> : null}</Link>;
}

function AccountArea({ user, loggingOut, onLogout, compact = false }: { user: SafeUser | null; loggingOut: boolean; onLogout: () => void; compact?: boolean }) {
  if (!user) return null;
  return <div className={cn("border-border", compact ? "mt-0" : "border-t px-4 py-4")}><div className="flex items-center gap-3"><Avatar name={user.name} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-text">{user.name}</p><Badge className="mt-1" tone="primary">{user.role}</Badge></div></div><div className="mt-3 flex gap-2"><Link className="flex-1 rounded-md border border-border px-3 py-2 text-center text-xs font-semibold text-text-muted hover:bg-surface hover:text-text" href="/dashboard/profile">Profile</Link><Button className="flex-1" loading={loggingOut} onClick={onLogout} size="sm" type="button" variant="ghost">Log out</Button></div></div>;
}
