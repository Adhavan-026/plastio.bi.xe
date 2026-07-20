import * as z from "zod";

export type ParseJsonLinesResult<T> = { ok: true; lines: T[] } | { ok: false; error: string };

/**
 * Parses and validates a JSON-encoded array of form lines — the same
 * pattern used for invoice items (itemsJson), BOM inputs, production run
 * inputs/outputs, and job work challan lines.
 */
export function parseJsonLines<T>(
  json: string,
  schema: z.ZodType<T>,
  minMessage: string
): ParseJsonLinesResult<T> {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid line data." };
  }
  const result = z.array(schema).min(1, { error: minMessage }).safeParse(raw);
  if (!result.success) {
    return { ok: false, error: "One or more lines are invalid." };
  }
  return { ok: true, lines: result.data };
}
