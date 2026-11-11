"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, Badge, Button, Card } from "@/components/ui";
import type { SafeUser } from "@/types/auth";
export function ProfileView({ initialUser }: { initialUser: SafeUser }) {
  const router = useRouter(); const [user, setUser] = useState(initialUser); const [profileStatus, setProfileStatus] = useState<"current" | "offline" | "unavailable">("current"); const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    const snapshotKey = `servicehub_profile_snapshot:${initialUser.id}`;
    localStorage.setItem(snapshotKey, JSON.stringify(initialUser));
    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/profile?cacheUserId=${encodeURIComponent(initialUser.id)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Profile refresh failed with status ${response.status}.`);
        const data = (await response.json()) as { user: SafeUser };
        setUser(data.user);
        setProfileStatus(response.headers.get("X-ServiceHub-Cache") === "stale" ? "unavailable" : "current");
        localStorage.setItem(snapshotKey, JSON.stringify(data.user));
      } catch {
        const snapshot = localStorage.getItem(snapshotKey);
        if (snapshot) {
          try {
            const cachedUser = JSON.parse(snapshot) as SafeUser;
            if (cachedUser.id === initialUser.id) setUser(cachedUser);
          } catch (error) {
            console.error("Unable to read the saved profile copy:", error);
          }
        }
        setProfileStatus(navigator.onLine ? "unavailable" : "offline");
      }
    };
    const markOffline = () => setProfileStatus("offline");
    const reloadWhenOnline = () => void loadProfile();
    void loadProfile();
    window.addEventListener("offline", markOffline);
    window.addEventListener("online", reloadWhenOnline);
    return () => {
      window.removeEventListener("offline", markOffline);
      window.removeEventListener("online", reloadWhenOnline);
    };
  }, [initialUser]);
  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem(`servicehub_profile_snapshot:${initialUser.id}`);
    navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_PRIVATE_CACHE" });
    router.replace("/");
    router.refresh();
  }
  return <div className="mx-auto w-full max-w-3xl">{profileStatus !== "current" ? <div className="mb-4 rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-amber-100" role="status">{profileStatus === "offline" ? "You are offline. Showing the saved profile copy, which may be outdated." : "ServiceHub could not refresh your profile. Showing the saved copy; check that the app server and database are available."}</div> : null}<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Your account</p><h1 className="mt-2 font-display text-3xl font-bold">Profile</h1><p className="mt-2 text-text-muted">Manage the details connected to your ServiceHub account.</p></div><div className="flex gap-2"><Button onClick={() => router.push("/dashboard/profile/edit")} variant="outline">Edit profile</Button><Button loading={loggingOut} onClick={logout} variant="ghost">Log out</Button></div></div><Card className="mt-8 p-5 sm:p-7"><div className="flex items-center gap-4 border-b border-border pb-6"><Avatar name={user.name} size="lg" /><div><h2 className="font-display text-xl font-bold">{user.name}</h2><p className="mt-1 text-sm text-text-muted">{user.email}</p><Badge className="mt-2" tone="primary">{user.role}</Badge></div></div><dl className="grid gap-5 pt-6 sm:grid-cols-2"><Detail label="Phone" value={user.phone} /><Detail label="City" value={user.city} /><div className="sm:col-span-2"><Detail label="Bio" value={user.bio} /></div></dl></Card></div>;
}
function Detail({ label, value }: { label: string; value?: string }) { return <div><dt className="text-xs font-semibold text-text-subtle">{label}</dt><dd className="mt-1 text-sm">{value || "Not added yet"}</dd></div>; }
