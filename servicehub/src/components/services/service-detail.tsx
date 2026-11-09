"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge, Card } from "@/components/ui";
import type { SafeService } from "@/types/service";
import { formatPrice } from "./service-card";
import { ReviewsSection } from "@/components/reviews/reviews-section";

const recentKey = "servicehub_recent_services";
const recentLimit = 12;

export function ServiceDetail({ initialService }: { initialService: SafeService }) {
  const [service, setService] = useState(initialService);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/services/${initialService.id}`);
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { service: SafeService };
      setService(data.service);
      setOffline(response.headers.get("X-ServiceHub-Cache") === "stale");
      saveRecent(data.service);
    } catch {
      const cached = readRecent().find((item) => item.id === initialService.id);
      if (cached) setService(cached);
      setOffline(true);
    }
  }, [initialService]);

  useEffect(() => {
    const recent = readRecent();
    localStorage.setItem(recentKey, JSON.stringify([initialService, ...recent.filter((item) => item.id !== initialService.id)].slice(0, recentLimit)));
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [initialService, refresh]);

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <Link className="text-sm font-semibold text-blue-300 hover:text-white" href="/services">← Back to services</Link>
        {offline ? <p aria-live="polite" className="mt-4 rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-amber-100">Offline copy — may be outdated</p> : null}
        <Card className="mt-6 p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">{service.category}</p><h1 className="mt-2 font-display text-3xl font-bold">{service.title}</h1></div>
            <Badge tone="success">Published</Badge>
          </div>
          <div className="mt-6 grid gap-4 border-y border-border py-5 sm:grid-cols-3">
            <div><p className="text-xs text-text-subtle">Price</p><p className="mt-1 font-semibold">{formatPrice(service.price, service.priceUnit)}</p></div>
            <div><p className="text-xs text-text-subtle">Service area</p><p className="mt-1 font-semibold">{service.city}</p></div>
            <div><p className="text-xs text-text-subtle">Provider</p><p className="mt-1 font-semibold">{service.provider?.name ?? "Local provider"}</p></div>
          </div>
          <div className="mt-7"><h2 className="font-display text-lg font-bold">About this service</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-muted">{service.description}</p></div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover" href={`/bookings/new/${service.id}`}>Continue to booking</Link><Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-text-muted hover:text-text" href={`/reports/new?targetType=SERVICE&targetId=${service.id}&label=${encodeURIComponent(service.title)}`}>Report service</Link></div>
          <ReviewsSection serviceId={service.id} />
        </Card>
      </div>
    </main>
  );
}

function readRecent(): SafeService[] {
  try {
    const value = JSON.parse(localStorage.getItem(recentKey) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter(isSafeService) : [];
  } catch {
    return [];
  }
}

function saveRecent(service: SafeService) {
  const recent = readRecent().filter((item) => item.id !== service.id);
  localStorage.setItem(recentKey, JSON.stringify([service, ...recent].slice(0, recentLimit)));
}

function isSafeService(value: unknown): value is SafeService {
  return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" && "title" in value && typeof value.title === "string";
}
