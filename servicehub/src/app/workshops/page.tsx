import { WorkshopCatalogue } from "@/components/workshops/workshop-experience";

export default function WorkshopsPage() {
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Provider workshops</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Learn and collaborate locally</h1>
        <p className="mt-3 text-text-muted">Browse upcoming workshops hosted by ServiceHub providers.</p>
        </div><WorkshopCatalogue /></div>
        </main>;
}
