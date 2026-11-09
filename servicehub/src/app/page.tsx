import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";

export default function Home() {
  return (
    <main className="bg-background">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <Badge tone="primary">A local marketplace built for trust</Badge>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">Find the right help, supplies, and skills for what comes next.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-text-muted sm:text-lg">ServiceHub connects customers with local providers, suppliers, and practical workshops in one calm, useful place.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/services"><Button size="lg">Explore services</Button></Link><Link href="/workshops"><Button size="lg" variant="outline">Browse workshops</Button></Link></div>
          <p className="mt-5 text-sm text-text-subtle">Browse publicly. Sign in when you are ready to book, order, or participate.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <LandingCard href="/services" label="Services" text="Find local providers and request help on your schedule." />
          <LandingCard href="/suppliers" label="Supplies" text="Browse useful products from local suppliers." />
          <LandingCard href="/workshops" label="Workshops" text="Learn practical skills and connect with providers." />
        </div>
      </section>
    </main>
  );
}

function LandingCard({ href, label, text }: { href: string; label: string; text: string }) {
  return <Link className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary hover:bg-surface-elevated" href={href}><p className="text-sm font-semibold text-blue-300">{label}</p><p className="mt-2 text-sm leading-6 text-text-muted">{text}</p><span className="mt-4 inline-block text-sm font-semibold text-text group-hover:text-blue-200">Explore <span aria-hidden="true">→</span></span></Link>;
}
