import { Logo } from "@/components/logo";

// Only links to pages/anchors that actually exist in this app — no
// Legal/About columns, since there's no Privacy/Terms/About page yet.
const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Modules", href: "#modules" },
      { label: "Reports", href: "#reports" },
      { label: "Get the Windows app", href: "/signup" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
    ],
  },
  {
    title: "Support",
    links: [{ label: "FAQ", href: "#faq" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t px-6 py-14 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
            <Logo className="h-6 w-auto" />
            <p className="text-muted-foreground max-w-40 text-xs">
              Billing built for how Indian shops actually work.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold tracking-wide uppercase">{column.title}</h3>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t pt-6">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} Click One. Built for Indian retail.
          </p>
        </div>
      </div>
    </footer>
  );
}
