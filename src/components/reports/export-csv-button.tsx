"use client";

import { Button } from "@/components/ui/button";
import { toCsv, type CsvColumn } from "@/lib/csv";

export function ExportCsvButton<T>({
  rows,
  columns,
  filename,
}: {
  rows: T[];
  columns: CsvColumn<T>[];
  filename: string;
}) {
  function handleExport() {
    const csv = toCsv(rows, columns);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
      Export CSV
    </Button>
  );
}
