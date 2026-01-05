import { Session } from "neo4j-driver";
import { Person, PersonCreateInput, PersonFilter } from "../domain/person";


export async function createNewPerson(
    person: PersonCreateInput,
    session: Session
): Promise<Person> {

    return await session.executeWrite( async (tx) => {

        const query = `
            CREATE (p:Person {
                id: randomUUID(),
                name: $name,
                sex: $sex,
                isAlive: $isAlive,
                birthDate: $birthDate,
                deathDate: $deathDate,
                createdAt: datetime(),
                updatedAt: datetime()
            })
            RETURN p
        `;

        const res = await tx.run(query, {
            name: person.name,
            sex: person.sex,
            isAlive: person.isAlive,
            birthDate: person.birthDate ? person.birthDate.toISOString() : null,
            deathDate: person.deathDate ? person.deathDate.toISOString() : null
        })

        if (res.records.length == 0) {
            throw new Error("Error creating node.")
        }
        return res.records[0].get('p').properties
    })
}

export async function findPersonById(
    id: string,
    session: Session
): Promise<Person> {
    
    return await session.executeRead( async (tx) => {

        const query = `
            MATCH (p:Person {
            id: $id})
            RETURN p
        `;

        const res = await tx.run(query, { id: id })

        if (res.records.length == 0) {
            throw new Error("Error searching for node.")
        }
        
        return res.records[0].get('p').properties
    })

}

export async function getPersons(
    q: PersonFilter,
    session: Session
) {

    const where: string[] = [];
    const params: Record<string, string | number | boolean | Date > = {};

    // --- filters ---
    if (q.name) {
        where.push("toLower(p.name) CONTAINS toLower($name)");
        params.name = q.name;
    }
    if (q.sex) {
        where.push("p.sex = $sex");
        params.sex = q.sex;
    }
    if (typeof q.isAlive === "boolean") {
        where.push("p.isAlive = $isAlive");
        params.isAlive = q.isAlive;
    }

    const range = (
        field: "birthDate" | "deathDate" | "createdAt" | "updatedAt",
        from?: Date,
        to?: Date
    ) => {
        if (from) {
            where.push(`p.${field} >= datetime($${field}_from)`);
            params[`${field}_from`] = from;
        }
        if (to) {
            where.push(`p.${field} <= datetime($${field}_to)`);
            params[`${field}_to`] = to;
        }
    };

    range("birthDate", q.birthDate_from, q.birthDate_to);
    range("deathDate", q.deathDate_from, q.deathDate_to);
    range("createdAt", q.createdAt_from, q.createdAt_to);
    range("updatedAt", q.updatedAt_from, q.updatedAt_to);

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // --- pagination ---
    const skip = (q.page - 1) * q.pageSize;
    params.skip = Math.trunc(skip);
    params.limit = Math.trunc(q.pageSize);

    // --- sorting (whitelist only) ---
    const sortByMap: Record<typeof q.sortBy, string> = {
        createdAt: "p.createdAt",
        updatedAt: "p.updatedAt",
        name: "p.name",
    };
    const orderBy = `${sortByMap[q.sortBy]} ${q.sortDir.toUpperCase()}`;

    // --- count query ---
    const countQuery = `
        MATCH (p:Person)
        ${whereClause}
        RETURN count(p) AS total
    `;

    // --- data query ---
    const dataQuery = `
        MATCH (p:Person)
        ${whereClause}
        RETURN p
        ORDER BY ${orderBy}
        SKIP toInteger($skip)
        LIMIT toInteger($limit)
    `;

    const { total, data } = await session.executeRead(async (tx) => {
        const countRes = await tx.run(countQuery, params);
        const dataRes = await tx.run(dataQuery, params);

        const total = countRes.records[0]?.get("total")?.toNumber?.() ?? 0;

        const data = dataRes.records.map((r) => {
            const p = r.get("p").properties;
            return {
                id: p.id,
                name: p.name,
                sex: p.sex,
                isAlive: p.isAlive,
                birthDate: p.birthDate ?? null,
                deathDate: p.deathDate ?? null,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            };
        });

        return { total, data };
});

const totalPages = Math.max(1, Math.ceil(total / q.pageSize));

return {
  data,
  pagination: {
    page: q.page,
    pageSize: q.pageSize,
    total,
    totalPages,
    hasNextPage: q.page < totalPages,
    hasPrevPage: q.page > 1,
  },
};

}