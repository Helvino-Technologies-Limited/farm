import { z } from "zod";
import { optionalNumber, optionalDate } from "./helpers";

export const plotSchema = z.object({
  code: z.string().min(1, "Plot code is required, e.g. 1A"),
  name: z.string().optional(),
  sizeAcres: optionalNumber(z.coerce.number().positive()),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export type PlotInput = z.infer<typeof plotSchema>;

export const cropCycleSchema = z.object({
  plotId: z.string().min(1),
  productId: z.string().optional(),
  cropName: z.string().min(1, "Crop name is required"),
  season: z.string().optional(),
  plantedDate: z.coerce.date(),
  expectedHarvestDate: optionalDate(),
  notes: z.string().optional(),
});

export type CropCycleInput = z.infer<typeof cropCycleSchema>;

export const cropExpenseSchema = z.object({
  cropCycleId: z.string().min(1),
  category: z.enum(["LABOUR", "SEEDS", "FERTILIZER", "CHEMICALS", "IRRIGATION", "EQUIPMENT", "TRANSPORT", "OTHER"]),
  description: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  quantity: optionalNumber(z.coerce.number().positive()),
  quantityUnit: z.string().optional(),
  date: optionalDate(),
  paymentMethod: z.enum(["CASH", "MPESA", "BANK", "CARD", "CHEQUE", "OTHER"]).optional(),
});

export type CropExpenseInput = z.infer<typeof cropExpenseSchema>;

export const harvestSchema = z.object({
  cropCycleId: z.string().min(1),
  date: optionalDate(),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit: z.string().min(1, "Unit is required, e.g. kg, bags"),
  amountReceived: z.coerce.number().min(0).default(0),
  buyer: z.string().optional(),
  notes: z.string().optional(),
});

export type HarvestInput = z.infer<typeof harvestSchema>;

export const closeCropCycleSchema = z.object({
  cropCycleId: z.string().min(1),
  status: z.enum(["COMPLETED", "ABANDONED"]),
  closedDate: optionalDate(),
});

export type CloseCropCycleInput = z.infer<typeof closeCropCycleSchema>;
