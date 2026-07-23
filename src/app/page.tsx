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
  ChevronDown,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

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

const FEATURES = [
  {
    icon: ReceiptText,
    title: "GST-ready invoicing",
    description:
      "CGST/SGST/IGST split automatically per line item, financial-year invoice numbers, and print-ready formats.",
  },
  {
    icon: PackageSearch,
    title: "Live inventory",
    description: "Stock levels update with every sale and purchase, with low-stock alerts built in.",
  },
  {
    icon: Wallet,
    title: "Payments & receivables",
    description: "Record partial or full payments and see exactly who owes what, and for how long, at a glance.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Reports, built in",
    description: "Sales, GST summary, item & party-wise, stock valuation, and profit & loss — no spreadsheets.",
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

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Splash — full-bleed brand banner, the first thing a visitor sees.
          Background is an original SVG mountain scene (hand-built, not a
          licensed photo) — soft bezier ridgelines with atmospheric blur on
          the distant layers, so it scales crisply at any size. */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-[#0a1729] px-6 text-center">
        <svg
          viewBox="0 0 1440 620"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="splash-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1729" />
              <stop offset="45%" stopColor="#1c3a5c" />
              <stop offset="100%" stopColor="#5c85a8" />
            </linearGradient>
            <filter id="haze-8" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <filter id="haze-5" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <filter id="haze-3" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <rect width="1440" height="620" fill="url(#splash-sky)" />
          <path
            filter="url(#haze-8)"
            d="M0,620 L0,171 C34.3,172.8 137.5,183.7 206,182 C274.5,180.3 342.5,165.5 411,161 C479.5,156.5 548.3,154.8 617,155 C685.7,155.2 754.3,164.2 823,162 C891.7,159.8 960.5,150.2 1029,142 C1097.5,133.8 1165.5,116.3 1234,113 C1302.5,109.7 1405.7,120.5 1440,122 L1440,620 Z"
            fill="#4a6f94"
            opacity="0.85"
          />
          <path
            filter="url(#haze-5)"
            d="M0,620 L0,237 C40.0,236.7 160.0,234.5 240,235 C320.0,235.5 400.0,244.8 480,240 C560.0,235.2 640.0,216.7 720,206 C800.0,195.3 880.0,176.0 960,176 C1040.0,176.0 1120.0,193.3 1200,206 C1280.0,218.7 1400.0,244.3 1440,252 L1440,620 Z"
            fill="#3f6088"
          />
          <path
            filter="url(#haze-3)"
            d="M0,620 L0,323 C40.0,316.0 160.0,287.8 240,281 C320.0,274.2 400.0,272.5 480,282 C560.0,291.5 640.0,323.8 720,338 C800.0,352.2 880.0,365.3 960,367 C1040.0,368.7 1120.0,351.5 1200,348 C1280.0,344.5 1400.0,346.3 1440,346 L1440,620 Z"
            fill="#34517a"
          />
          <path
            d="M0,620 L0,388 C48.0,396.5 192.0,425.8 288,439 C384.0,452.2 480.0,465.3 576,467 C672.0,468.7 768.0,453.0 864,449 C960.0,445.0 1056.0,441.5 1152,443 C1248.0,444.5 1392.0,455.5 1440,458 L1440,620 Z"
            fill="#28405f"
          />
          <path
            d="M0,620 L0,551 C48.0,547.8 192.0,535.3 288,532 C384.0,528.7 480.0,529.8 576,531 C672.0,532.2 768.0,542.0 864,539 C960.0,536.0 1056.0,523.2 1152,513 C1248.0,502.8 1392.0,483.8 1440,478 L1440,620 Z"
            fill="#1a2c47"
          />
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/35" />
        <Logo className="relative h-16 w-auto shrink-0 brightness-0 invert drop-shadow-[0_2px_16px_rgba(0,0,0,0.4)] sm:h-20 md:h-24" />
        <p className="relative mt-6 text-xs font-semibold tracking-[0.3em] text-white/70 uppercase sm:text-sm">
          GST Billing, Simplified
        </p>
        <a
          href="#top"
          className="absolute bottom-8 text-white/60 transition-colors hover:text-white/90"
          aria-label="Scroll down"
        >
          <ChevronDown className="size-7 animate-bounce" />
        </a>
      </section>

      <header id="top" className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur-sm sm:px-10">
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
        {/* Hero */}
        <section className="grid grid-cols-1 items-center gap-12 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div className="flex flex-col gap-6">
            <span className="bg-accent text-accent-foreground w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              GST Billing, Simplified
            </span>
            <h1 className="max-w-xl text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem]">
              Billing built for how Indian shops actually work.
            </h1>
            <p className="text-muted-foreground max-w-md text-lg">
              GST-ready invoices, live inventory, and reports for agro and tyre retailers — all in
              one place, purpose-built for Indian retail.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/login" />} nativeButton={false} className="px-8">
                Get Started
                <ArrowRight />
              </Button>
              <Button size="lg" variant="outline" render={<a href="#features" />} nativeButton={false}>
                See features
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">No credit card. Set up your shop in minutes.</p>
            <Link
              href="/signup"
              className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium underline underline-offset-4 transition-colors"
            >
              <Download className="size-4" />
              Prefer offline? Get the Windows app
            </Link>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="bg-primary/20 absolute -top-8 -right-6 -z-10 size-56 rounded-full blur-3xl" />
            <DashboardMockup />
          </div>
        </section>

        {/* Audience strip */}
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

        {/* Features */}
        <section id="features" className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-primary text-xs font-bold tracking-wide uppercase">
              Everything your shop needs
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              One system for billing, stock, and reports.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md"
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

        {/* Modules */}
        <section id="modules" className="bg-white/60 px-6 py-24 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <span className="text-primary text-xs font-bold tracking-wide uppercase">
                Industry modules
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Two specialized toolkits, one core system.
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {MODULES.map((mod) => (
                <div key={mod.title} className="bg-card flex flex-col gap-4 rounded-2xl border p-7 shadow-sm">
                  <span className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <mod.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{mod.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{mod.description}</p>
                  </div>
                  <ul className="flex flex-col gap-2.5">
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
            <p className="text-muted-foreground mt-6 text-center text-sm">
              Running a general store? Skip both and use the core billing system as-is.
            </p>
          </div>
        </section>

        {/* Reports */}
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

        {/* How it works */}
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

        {/* FAQ */}
        <section id="faq" className="mx-auto w-full max-w-3xl px-6 py-24 sm:px-10">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-primary text-xs font-bold tracking-wide uppercase">Questions</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group bg-card rounded-xl border p-5 open:shadow-sm">
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

        {/* Final CTA */}
        <section className="px-6 py-20 sm:px-10">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl bg-linear-to-br from-[#0d1b33] via-[#1e3a76] to-[#4a7cba] px-8 py-16 text-center text-white">
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
      </main>

      <footer className="border-t px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo className="h-5 w-auto" />
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} Click One. Built for Indian retail.
          </p>
        </div>
      </footer>
    </div>
  );
}
