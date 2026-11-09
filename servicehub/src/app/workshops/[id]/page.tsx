import { WorkshopDetail } from "@/components/workshops/workshop-experience";

export default async function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-6xl"><WorkshopDetail id={id} /></div></main>;
}
