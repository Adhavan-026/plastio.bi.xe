"use client";

import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

// motion.div/span/h1/p use hooks internally, so this whole block has to
// live behind a "use client" boundary — it can't be inlined into
// src/app/page.tsx (a server component). ParallaxHero renders this as its
// children.
function DashboardMockup() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-2xl">
      <div className="flex items-center gap-1.5 border-b bg-neutral-50 px-3 py-2.5">
        <span className="size-2.5 rounded-full bg-neutral-300" />
        <span className="size-2.5 rounded-full bg-neutral-300" />
        <span className="size-2.5 rounded-full bg-neutral-300" />
        <span className="text-muted-foreground ml-2 rounded-md bg-white px-2 py-0.5 text-[10px] ring-1 ring-neutral-200">
          app.clickone.in/dashboard
        </span>
      </div>
      <div className="flex">
        <div className="flex w-10 flex-col items-center gap-3 border-r bg-neutral-50 py-3">
          <span className="bg-primary size-5 rounded-md" />
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="size-3 rounded-sm bg-neutral-200" />
          ))}
        </div>
        <div className="flex-1 space-y-3 p-3.5">
          <div className="flex items-center justify-between">
            <span className="h-2.5 w-20 rounded bg-neutral-200" />
            <span className="bg-primary h-5 w-16 rounded-md" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["bg-primary", "₹1,01,641"],
              ["bg-chart-4", "13"],
              ["bg-chart-5", "2"],
            ].map(([tone, value]) => (
              <div key={value} className="rounded-lg border p-2">
                <span className={`block h-1 w-5 rounded-full ${tone}`} />
                <span className="mt-1.5 block text-xs font-bold">{value}</span>
              </div>
            ))}
          </div>
          <div className="h-20 rounded-lg border p-2">
            <svg viewBox="0 0 200 60" className="h-full w-full" preserveAspectRatio="none">
              <polyline
                points="0,45 25,40 50,42 75,20 100,28 125,15 150,22 175,8 200,18"
                fill="none"
                className="stroke-primary"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="space-y-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border px-2 py-1.5">
                <span className="h-2 w-24 rounded bg-neutral-200" />
                <span className="h-2 w-10 rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroForeground() {
  return (
    <section className="relative grid grid-cols-1 items-center gap-12 px-6 py-24 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:py-36">
      <div className="flex flex-col gap-6">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase ring-1 ring-white/25 backdrop-blur-sm"
        >
          GST Billing, Simplified
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-xl text-4xl leading-tight font-bold tracking-tight text-balance text-white sm:text-5xl lg:text-[3.5rem]"
        >
          Billing built for how Indian shops actually work.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-md text-lg text-white/80"
        >
          GST-ready invoices, live inventory, and reports for agro and tyre retailers — all in one
          place, purpose-built for Indian retail.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center gap-3"
        >
          <Button size="lg" render={<Link href="/login" />} nativeButton={false} className="px-8">
            Get Started
            <ArrowRight />
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<a href="#features" />}
            nativeButton={false}
            className="border-white/30 bg-white/5 text-white hover:bg-white/15"
          >
            See features
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col gap-2"
        >
          <p className="text-sm text-white/70">No credit card. Set up your shop in minutes.</p>
          <Link
            href="/signup"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-white/80 underline underline-offset-4 transition-colors hover:text-white"
          >
            <Download className="size-4" />
            Prefer offline? Get the Windows app
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative flex justify-center lg:justify-end"
      >
        <div className="absolute -top-8 -right-6 -z-10 size-56 rounded-full bg-white/20 blur-3xl" />
        <DashboardMockup />
      </motion.div>
    </section>
  );
}
