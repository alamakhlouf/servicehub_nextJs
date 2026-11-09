import { Catalogue } from "@/components/services/catalogue";

export default function ServicesPage() {
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-6xl"><div className="mb-8 max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Local services</p><h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Find help nearby</h1><p className="mt-3 text-text-muted">Browse published services from local providers. You can explore without signing in.</p></div><Catalogue /></div></main>;
}
