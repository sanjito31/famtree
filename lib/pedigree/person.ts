import { Session } from "neo4j-driver";
import { 
    Person, 
    PersonCreateInput, 
    PersonFilter, 
    PersonEditInput, 
    PersonEditSchema,
    toPerson 
} from "../domain/person";
import { AppError, HttpStatus } from "../errors/error";

/**
 * Create a new person node in the database.
 * @param person PersonCreateInput(name, sex, isAlive, birthDate?, deathDate?)
 * @param session neo4j session object
 * @returns newly created Person object
 */
export async function createNewPerson(
    person: PersonCreateInput,
    session: Session
): Promise<Person> {

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

    const params = {
        name: person.name,
        sex: person.sex,
        isAlive: person.isAlive,
        birthDate: person.birthDate ? person.birthDate.toISOString() : null,
        deathDate: person.deathDate ? person.deathDate.toISOString() : null
    }

    const result = await session.executeWrite(async (tx) => {
        return await tx.run(query, params)
    })

    if (result.records.length == 0) {
        throw new AppError("Error creating Person.", HttpStatus.INTERNAL_ERROR)
    }

    return toPerson(result.records[0].get('p').properties)
}

/**
 * Finds a specific person by ID
 * @param id UUID string of the Person object to find
 * @param session neo4j session object
 * @returns Person object
 */
export async function findPersonById(
    id: string,
    session: Session
): Promise<Person> {

    const query = 
        `
            MATCH (p:Person { id: $id })
            RETURN p
        `;
    
    const result = await session.executeRead(async (tx) => {
        return await tx.run(query, { id: id })
    })

    if (result.records.length == 0) {
        throw new AppError("Person not found.", HttpStatus.NOT_FOUND)
    }
        
    return toPerson(result.records[0].get('p').properties)

}


/**
 * Finds collection of Persons using query params. Supports paginated responses.
 * @param q PersonFilter, query parameters to search by (name, sex, isAlive, birthDates, deathDates, createdAt, updatedAt)
 * @param session Neo4j session object
 * @returns Collection of Persons with pagination
 */
export async function getPersons(
    q: PersonFilter,
    session: Session
) { // TODO: Define return object shape

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
            return toPerson(p)
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


/**
 * Edits a Person object when specified by ID
 * @param input Fields to update with new values. Must include ID
 * @param session Neo4j session object
 * @returns Updated Person object
 */
export async function editPerson(
    input: PersonEditInput,
    session: Session
): Promise<Person> {
    
    const edit = PersonEditSchema.parse(input)

    const setClauses: string[] = ["p.updatedAt = datetime()"];
    const params: Record<string, string | number | Date | boolean> = { id: edit.id };

    if (edit.name !== undefined) {
        setClauses.push("p.name = $name")
        params.name = edit.name
    }
    if (edit.sex !== undefined) {
        setClauses.push("p.sex = $sex")
        params.sex = edit.sex
    }
    if (edit.isAlive !== undefined) {
        setClauses.push("p.isAlive = $isAlive")
        params.isAlive = edit.isAlive
    }

    if (edit.birthDate !== undefined) {
        if (edit.birthDate === null) {
            setClauses.push("p.birthDate = null")
        } else {
            setClauses.push("p.birthDate = date($birthDate)")
            params.birthDate = edit.birthDate.toISOString().split("T")[0]
        }
    }

    if (edit.deathDate !== undefined) {
        if (edit.deathDate === null) {
            setClauses.push("p.deathDate = null")
        } else {
            setClauses.push("p.deathDate = date($deathDate)")
            params.deathDate = edit.deathDate.toISOString().split("T")[0]
        }
    }

    if (setClauses.length === 1) {
        throw new Error("No editable fields provided.")
    }

    const cypher = `
        MATCH (p:Person { id: $id })
        SET ${setClauses.join(", ")}
        RETURN p
    `;

    console.log(cypher)
    console.log(params)

    const result = await session.executeWrite(async (tx) => {
        return tx.run(cypher, params)
    })

    if (result.records.length === 0) {
        throw new AppError("Person not found.", HttpStatus.NOT_FOUND)
    }

    return toPerson(result.records[0].get("p").properties)
}


/**
 * Deletes a Person object specified by ID. This action is permanent and cannot be undone.
 * @param id UUID of Person object to delete
 * @param session Neo4j session object
 * @returns Person deleted
 */
export async function deletePerson(
    id: string,
    session: Session
): Promise<Person> {

    const result = await session.executeWrite(async (tx) => {
        return await tx.run(
            `
            MATCH (p:Person {id: $id})
            WITH p as deletedPerson
            DETACH DELETE p
            RETURN deletedPerson
            `,
            { id }
        )
    })

    const record = result.records[0]
    
    if (!record) {
        throw new AppError("Person not found.", HttpStatus.NOT_FOUND)
    }

    return toPerson(record.get("deletedPerson").properties)

}