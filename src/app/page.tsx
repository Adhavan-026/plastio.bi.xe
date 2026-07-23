import Link from "next/link";
import {
  ReceiptText,
  PackageSearch,
  ChartNoAxesCombined,
  ArrowRight,
  CheckCircle2,
  Wallet,
  Users,
  Building2,
  BookUser,
  ALargeSmall,
  Sprout,
  Disc3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { FeatureShowcaseRow, type FlagshipFeature } from "@/components/landing/feature-showcase";
import { SiteFooter } from "@/components/landing/site-footer";
import { SmoothScrollProvider } from "@/components/landing/smooth-scroll-provider";
import { Reveal } from "@/components/landing/reveal";
import { ParallaxHero } from "@/components/landing/parallax-hero";
import { ParallaxSectionBg } from "@/components/landing/parallax-section-bg";
import { HeroForeground } from "@/components/landing/hero-foreground";

const AUDIENCES = ["Agro & Fertilizer Shops", "Tyre & Auto Shops", "General Retail"];

// Cycled across the feature icon badges below so all 5 Astro Novalite
// swatches (biscay, steel blue, cornflower, double colonial white, rose
// bud) show up at their true hue, not just the derived primary/accent.
const FEATURE_TINTS = [
  "bg-[#1e3a76]/10 text-[#1e3a76]",
  "bg-[#4a7cba]/15 text-[#4a7cba]",
  "bg-[#8cb2e3]/25 text-[#1e3a76]",
  "bg-[#f0e3a8]/40 text-[#8a6d1f]",
  "bg-[#f7a1a1]/25 text-[#b23a3a]",
];

// The 3 headline features get the large alternating showcase treatment
// (FeatureShowcaseRow); everything else stays in the compact grid below —
// same "hero features get big treatment, rest get a grid" split used by
// most SaaS landing pages.
const FLAGSHIP_FEATURES: FlagshipFeature[] = [
  {
    icon: ReceiptText,
    eyebrow: "Billing",
    title: "GST-ready invoicing",
    description:
      "Every invoice splits CGST/SGST or IGST automatically per line item, numbers itself by financial year, and prints ready to hand over — no manual GST math, ever.",
    points: [
      "Correct tax split for in-state vs. interstate sales",
      "Financial-year invoice numbering, no gaps or duplicates",
      "Print-ready format, no separate PDF tool needed",
    ],
    tint: "bg-[#1e3a76]/15",
  },
  {
    icon: PackageSearch,
    eyebrow: "Inventory",
    title: "Live inventory, always accurate",
    description:
      "Stock levels update the moment a sale or purchase happens — no end-of-day reconciliation, no guessing what's actually on the shelf.",
    points: [
      "Stock adjusts automatically with every invoice",
      "Low-stock alerts before you run out",
      "Batch & expiry tracking for agro, warranty tracking for tyres",
    ],
    tint: "bg-[#4a7cba]/15",
  },
  {
    icon: ChartNoAxesCombined,
    eyebrow: "Reports",
    title: "Know your numbers, instantly",
    description:
      "Six built-in reports — sales, GST, item and party-wise, stock valuation, and profit & loss — ready the moment you need them, no spreadsheets involved.",
    points: [
      "GSTR-1 style GST summary, rate-wise and HSN-wise",
      "Party-wise and item-wise breakdowns",
      "Every report exports to CSV in one click",
    ],
    tint: "bg-[#8cb2e3]/20",
  },
];

const FEATURES = [
  {
    icon: Wallet,
    title: "Payments & receivables",
    description: "Record partial or full payments and see exactly who owes what, and for how long, at a glance.",
  },
  {
    icon: Users,
    title: "Role-based access",
    description: "Bring your team in as Owner, Manager, Cashier, or Accountant, each with the right level of access.",
  },
  {
    icon: Building2,
    title: "Multi-tenant by design",
    description: "Every shop's data, products, and users are fully isolated — yours never mixes with anyone else's.",
  },
  {
    icon: BookUser,
    title: "Party ledgers",
    description: "A running statement for every customer and supplier, generated automatically from real invoices.",
  },
  {
    icon: ALargeSmall,
    title: "Built for accessibility",
    description: "Adjustable font size across the whole app, remembered per device.",
  },
];

const MODULES = [
  {
    icon: Sprout,
    title: "Agro & Fertilizer",
    description: "For dealers who need to track stock by batch, not just quantity.",
    points: [
      "Batch & expiry tracking per product",
      "Expiry alerts before stock goes bad",
      "Dealer license number printed on every invoice",
    ],
  },
  {
    icon: Disc3,
    title: "Tyre & Auto",
    description: "For shops fitting tyres, not just selling them.",
    points: [
      "Vehicle number & type on every sale",
      "Old-tyre exchange value handled automatically",
      "Serial number + warranty months, with instant lookup",
    ],
  },
];

const REPORTS = [
  "Sales report",
  "GST summary (GSTR-1 style)",
  "Item-wise sales",
  "Party-wise sales",
  "Stock valuation",
  "Profit & loss",
];

const STEPS = [
  {
    title: "Set up your shop",
    description: "Sign up, pick Agro, Tyre, or general retail, and add your GST & state details.",
  },
  {
    title: "Add your catalog",
    description: "Bring in products with HSN codes and GST rates, plus your customers and suppliers.",
  },
  {
    title: "Bill, track, report",
    description: "Create GST-correct invoices in seconds, record payments, and watch stock and receivables update live.",
  },
];

const FAQS = [
  {
    q: "Is this built specifically for Indian GST compliance?",
    a: "Yes. CGST/SGST apply for in-state sales and IGST for interstate, computed automatically on every line item, with financial-year invoice numbering.",
  },
  {
    q: "Does it support agro and tyre shops specifically?",
    a: "Yes — dedicated modules for batch/expiry tracking (agro) and vehicle/warranty tracking (tyres). General shops can use the core billing system without either.",
  },
  {
    q: "Is my shop's data separate from other shops on the platform?",
    a: "Yes. Every shop is a fully isolated tenant — data, products, invoices, and users never cross between shops.",
  },
  {
    q: "Can more than one person from my shop use it?",
    a: "Yes. Invite your team with role-based access: Owner, Manager, Cashier, or Accountant.",
  },
  {
    q: "Can I get my numbers out without extra software?",
    a: "Every built-in report — sales, GST, item/party-wise, stock valuation, and profit & loss — exports to CSV in one click.",
  },
];

export default function Home() {
  return (
    <SmoothScrollProvider>
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur-sm sm:px-10">
        <Logo className="h-7 w-auto" />
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#modules" className="text-muted-foreground hover:text-foreground transition-colors">
            Modules
          </a>
          <a href="#reports" className="text-muted-foreground hover:text-foreground transition-colors">
            Reports
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline">
            Log in
          </Link>
          <Button render={<Link href="/login" />} nativeButton={false} size="sm">
            Get Started
          </Button>
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero — background lives in ParallaxHero (scroll-linked parallax
            layer + placeholder gradient art, swaps to a real Whisk/Flow
            image or video automatically once one exists at
            /landing/hero-bg.jpg or /landing/hero-loop.mp4). Foreground
            content is a separate client component (HeroForeground) since
            its entrance animations need motion/react, which requires a
            "use client" boundary this server component can't provide
            directly. */}
        <ParallaxHero>
          <HeroForeground />
        </ParallaxHero>

        {/* Audience strip */}
        <Reveal>
          <section className="border-y bg-white/60 px-6 py-8 sm:px-10">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Built for
              </span>
              {AUDIENCES.map((a) => (
                <span key={a} className="text-sm font-semibold">
                  {a}
                </span>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Flagship features — large alternating rows for the 3 headline
            capabilities, before the compact grid covers the rest. */}
        <section id="features" className="mx-auto w-full max-w-5xl px-6 py-24 sm:px-10">
          <Reveal className="mx-auto mb-16 max-w-2xl text-center">
            <span className="text-primary text-xs font-bold tracking-wide uppercase">
              Everything your shop needs
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              One system for billing, stock, and reports.
            </h2>
          </Reveal>
          <div className="flex flex-col gap-20">
            {FLAGSHIP_FEATURES.map((item, i) => (
              <Reveal key={item.title} delay={0.1}>
                <FeatureShowcaseRow item={item} reversed={i % 2 === 1} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* Compact feature grid — everything else. */}
        <Reveal>
          <section className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <div
                  key={feature.title}
                  className="bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${FEATURE_TINTS[i % FEATURE_TINTS.length]}`}
                  >
                    <feature.icon className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Modules — given a bolder, full-bleed tinted section treatment,
            mirroring how industry-specific callouts get more visual weight
            on most SaaS landing pages. */}
        <Reveal>
        <section id="modules" className="relative bg-primary/[0.04] px-6 py-28 sm:px-10">
          <ParallaxSectionBg src="/landing/modules-bg.jpg" />
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <span className="text-primary text-xs font-bold tracking-wide uppercase">
                Industry modules
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Two specialized toolkits, one core system.
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {MODULES.map((mod) => (
                <div key={mod.title} className="bg-card flex flex-col gap-5 rounded-2xl border p-8 shadow-md">
                  <span className="bg-primary text-primary-foreground flex size-14 shrink-0 items-center justify-center rounded-2xl">
                    <mod.icon className="size-6" />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold">{mod.title}</h3>
                    <p className="text-muted-foreground mt-1.5 text-base">{mod.description}</p>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {mod.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-8 text-center text-sm">
              Running a general store? Skip both and use the core billing system as-is.
            </p>
          </div>
        </section>
        </Reveal>

        {/* Reports */}
        <Reveal>
        <section id="reports" className="mx-auto w-full max-w-4xl px-6 py-24 sm:px-10">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-primary text-xs font-bold tracking-wide uppercase">
              Know your numbers
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Six reports, zero spreadsheets.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {REPORTS.map((report) => (
              <div key={report} className="bg-card flex items-center gap-3 rounded-xl border p-4">
                <CheckCircle2 className="text-primary size-5 shrink-0" />
                <span className="text-sm font-semibold">{report}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Every report exports to CSV in one click.
          </p>
        </section>
        </Reveal>

        {/* How it works */}
        <Reveal>
        <section className="bg-white/60 px-6 py-24 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <span className="text-primary text-xs font-bold tracking-wide uppercase">
                Getting started
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Up and running in three steps.
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex flex-col gap-3">
                  <span className="border-primary text-primary flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold">
                    {i + 1}
                  </span>
                  <h3 className="text-base font-bold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        </Reveal>

        {/* FAQ */}
        <Reveal>
        <section id="faq" className="mx-auto w-full max-w-3xl px-6 py-24 sm:px-10">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-primary text-xs font-bold tracking-wide uppercase">Questions</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="bg-card divide-y rounded-xl border shadow-sm">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                  {faq.q}
                  <span className="text-muted-foreground ml-4 shrink-0 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="text-muted-foreground mt-3 text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
        </Reveal>

        {/* Final CTA */}
        <Reveal>
        <section className="px-6 py-20 sm:px-10">
          <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 overflow-hidden rounded-3xl bg-linear-to-br from-[#0d1b33] via-[#1e3a76] to-[#4a7cba] px-8 py-16 text-center text-white">
            <ParallaxSectionBg src="/landing/cta-bg.jpg" opacityClassName="opacity-30" />
            <h2 className="max-w-lg text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Ready to bill smarter?
            </h2>
            <p className="max-w-md text-white/80">
              Set up your shop and send your first GST-correct invoice in minutes.
            </p>
            <Button
              size="lg"
              render={<Link href="/login" />}
              nativeButton={false}
              className="bg-white px-8 text-[#1e3a76] hover:bg-white/90"
            >
              Get Started
              <ArrowRight />
            </Button>
          </div>
        </section>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
    </SmoothScrollProvider>
  );
}
