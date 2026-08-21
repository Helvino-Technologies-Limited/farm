import { z } from "zod";

/**
 * A coerced-number field that's actually optional. Plain `z.coerce.number().optional()` is a trap:
 * `z.coerce.number()` runs `Number(input)` before `.optional()` ever sees it, and `Number("") === 0`
 * — so an empty HTML number input silently becomes `0` instead of "not provided". That's dangerous
 * for fields like maxAgeDays/maxQty/maximumStock where 0 means something very different from unset.
 * This preprocesses blank values to `undefined` first so `.optional()` actually works.
 */
export function optionalNumber<T extends z.ZodTypeAny>(schema: T = z.coerce.number() as unknown as T) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    schema.optional()
  );
}

/** Same trap as optionalNumber, but for dates: `new Date("")` is an Invalid Date, which
 * `z.coerce.date()` correctly rejects — meaning an "optional" date field would force the
 * user to always fill it in. This lets a blank date field mean "not provided". */
export function optionalDate() {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.date().optional()
  );
}
