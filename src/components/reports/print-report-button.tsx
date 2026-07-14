"use client";

import { Button } from "@/components/ui/button";

export function PrintReportButton() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()} className="print:hidden">
      Download PDF
    </Button>
  );
}
