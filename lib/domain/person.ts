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

export const PersonEditSchema = PersonBaseSchema.pick({
  id: true
}).extend({
  name: PersonBaseSchema.shape.name.optional(),
  sex: PersonBaseSchema.shape.sex.optional(),
  isAlive: PersonBaseSchema.shape.isAlive.optional(),
  birthDate: PersonBaseSchema.shape.birthDate.optional().nullable(),
  deathDate: PersonBaseSchema.shape.deathDate.optional().nullable(),
}).strict()

export type Person = z.infer<typeof PersonBaseSchema>;
export type PersonCreateInput = z.infer<typeof PersonCreateSchema>;
export type PersonFilter = z.infer<typeof PersonFilterSchema>;
export type PersonEditInput = z.infer<typeof PersonEditSchema>;


/*

Person type helper functions

*/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function neo4jTemporalToDate(v: any): Date | null {
  if (v == null) return null;

  // Neo4j Date/DateTime objects from the driver often have toString().
  // Fall back to Date parsing.
  if (typeof v?.toString === "function") {
    const s = v.toString(); // "YYYY-MM-DD" or ISO datetime
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  if (v instanceof Date) return v;

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toPerson(props: Record<string, any>): Person {
  const normalized = {
    ...props,
    birthDate: neo4jTemporalToDate(props.birthDate),
    deathDate: neo4jTemporalToDate(props.deathDate),
    createdAt: neo4jTemporalToDate(props.createdAt),
    updatedAt: neo4jTemporalToDate(props.updatedAt),
  };

  return PersonBaseSchema.parse(normalized);
}