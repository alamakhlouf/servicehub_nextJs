import { Avatar, Badge, Button, Card, Input, Loading, Select, Textarea } from "@/components/ui";

export default function DesignSystemPage() {
  return (
    <main className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl"><Badge tone="primary">Design system specimen</Badge><h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">The shared language for ServiceHub.</h1><p className="mt-4 max-w-xl text-base leading-7 text-text-muted">A reference page for the reusable components used across the marketplace.</p></div>
        <section aria-labelledby="components-heading" className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5 sm:p-6"><h2 className="font-display text-lg font-bold" id="components-heading">Core components</h2><p className="mt-1 text-sm text-text-muted">Buttons, statuses, avatars, and loading behavior.</p><div className="mt-6 flex flex-wrap gap-2"><Button>Primary action</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outlined</Button><Button variant="ghost">Quiet action</Button><Button variant="danger" size="sm">Destructive</Button></div><div className="mt-6 flex flex-wrap items-center gap-2"><Badge tone="success">Published</Badge><Badge tone="warning">Pending</Badge><Badge tone="error">Needs attention</Badge><Badge>Draft</Badge><Avatar name="ServiceHub team" /></div><div className="mt-6 border-t border-border pt-5"><Loading label="Loading available services" /></div></Card>
          <Card className="p-5 sm:p-6"><h2 className="font-display text-lg font-bold">Form language</h2><p className="mt-1 text-sm text-text-muted">Labels, helper text, and focus states stay consistent.</p><div className="mt-6 grid gap-4"><Input label="Search services" placeholder="What do you need help with?" /><Select label="Service category" defaultValue=""><option disabled value="">Choose a category</option><option>Home repair</option><option>Personal care</option></Select><Textarea label="Short note" hint="Optional · 500 characters maximum" placeholder="Tell the provider what you need..." /></div></Card>
        </section>
      </div>
    </main>
  );
}
