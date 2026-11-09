import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { requireUser } from "@/lib/auth/guards";
export default async function EditProfilePage() { return <main className="flex min-h-screen items-start justify-center bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><ProfileEditForm user={await requireUser()} /></main>; }
