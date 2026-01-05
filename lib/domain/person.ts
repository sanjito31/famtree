import { z } from "zod";

export const PersonBaseSchema = z.object({
    id: z.uuid(),

    name: z.string().min(1),
    sex: z.enum(["male", "female"]),
    isAlive: z.boolean(),
    birthDate: z.coerce.date().optional(),
    deathDate: z.coerce.date().optional(),

    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
})

export const PersonCreateSchema = PersonBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Person = z.infer<typeof PersonBaseSchema>;
export type PersonCreateInput = z.infer<typeof PersonCreateSchema>;

export const PersonFilterSchema = PersonBaseSchema.pick({
  name: true,
  sex: true,
  isAlive: true,
  birthDate: true,
  deathDate: true,
  createdAt: true,
  updatedAt: true,
})
  .partial()
  .extend({

    name: z.string().min(1).optional(),

    isAlive: z
      .enum(["true", "false"])
      .transform(v => v === "true")
      .optional(),

    birthDate_from: z.coerce.date().optional(),
    birthDate_to: z.coerce.date().optional(),

    deathDate_from: z.coerce.date().optional(),
    deathDate_to: z.coerce.date().optional(),

    createdAt_from: z.coerce.date().optional(),
    createdAt_to: z.coerce.date().optional(),

    updatedAt_from: z.coerce.date().optional(),
    updatedAt_to: z.coerce.date().optional(),

    // Pagination
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),

    // sorting (optional)
    sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("updatedAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc"),
  });

export type PersonFilter = z.infer<typeof PersonFilterSchema>