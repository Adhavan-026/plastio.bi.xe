import { notFound } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { getTenantDb } from "@/lib/tenant-db";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StartRunButton, CancelRunButton } from "./run-actions";
import { CompleteRunForm } from "./complete-run-form";

const STATUS_VARIANT: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  DRAFT: "secondary",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export default async function ProductionRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveSubscription();
  const { id } = await params;
  const db = await getTenantDb();

  const run = await db.productionRun.findUnique({
    where: { id },
    include: {
      bom: { select: { name: true, outputProductId: true } },
      inputs: { include: { product: { select: { name: true, unit: true } } } },
      outputs: { include: { product: { select: { name: true, unit: true } } } },
    },
  });
  if (!run) notFound();

  const products = await db.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, unit: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{run.runNumber}</h1>
          <Badge variant={STATUS_VARIANT[run.status]}>{run.status.replace("_", " ")}</Badge>
          {run.wastageExceeded && (
            <Badge variant="destructive">
              <TriangleAlert className="size-3" /> Wastage exceeded
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {run.status === "DRAFT" && <StartRunButton runId={run.id} />}
          {(run.status === "DRAFT" || run.status === "IN_PROGRESS") && <CancelRunButton runId={run.id} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">BOM</p>
          <p className="font-medium">{run.bom?.name ?? "Ad-hoc (no BOM)"}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Started</p>
          <p className="font-medium">{run.startedAt ? run.startedAt.toLocaleString("en-IN") : "—"}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Completed</p>
          <p className="font-medium">{run.completedAt ? run.completedAt.toLocaleString("en-IN") : "—"}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Yield</p>
          <p className="font-medium">{run.yieldPercent != null ? `${Number(run.yieldPercent).toFixed(1)}%` : "—"}</p>
        </div>
      </div>

      {run.notes && <p className="text-muted-foreground text-sm">{run.notes}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {run.inputs.map((input) => (
                  <TableRow key={input.id}>
                    <TableCell>{input.product.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(input.qty)} {input.product.unit}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">₹{Number(input.unitCost).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {run.status === "IN_PROGRESS" && (
        <Card>
          <CardHeader>
            <CardTitle>Complete run — enter actual outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <CompleteRunForm runId={run.id} products={products} suggestedOutputProductId={run.bom?.outputProductId ?? null} />
          </CardContent>
        </Card>
      )}

      {run.outputs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {run.outputs.map((output) => (
                    <TableRow key={output.id}>
                      <TableCell>{output.product.name}</TableCell>
                      <TableCell>
                        <Badge variant={output.outputType === "WASTAGE" ? "destructive" : "secondary"}>
                          {output.outputType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(output.qty)} {output.product.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
