import { ProfileView } from "@/components/profile/profile-view";
import { requireUser } from "@/lib/auth/guards";
export default async function ProfilePage() { return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><ProfileView initialUser={await requireUser()} /></main>; }
