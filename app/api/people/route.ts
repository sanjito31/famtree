import { PersonCreateInput, PersonCreateSchema, PersonFilterSchema } from "@/lib/domain/person";
import { createNewPerson, getPersons } from "@/lib/pedigree/person";
import { getSession } from "@/lib/db/neo4j";
import { NextRequest, NextResponse } from "next/server";
import { Session } from "neo4j-driver";
import { toErrorResponse } from "@/lib/errors/error";
import { z } from "zod"


/**
 * Create a new Person object
 * @param request NextRequest containing PersonCreateInput(name, sex, isAlive, birthDate?, deathDate?)
 * @returns Person object
 */
export async function POST(
    request: NextRequest
) { // TODO: Define return type shape
    const session: Session = await getSession()

    try {
        const body = await request.json()

        // TODO: Move to inside of createNewPerson
        const person: PersonCreateInput = PersonCreateSchema.parse(body)
        
        const result = await createNewPerson(person, session)

        return NextResponse.json(
            { detail: result },
            { status: 201 }
        )

    } catch (error) {
        console.error("Error creating person.", error);
        return toErrorResponse(error)
    } finally {
        await session.close()
    }
}

/**
 * Return a collection of Person objects searchable by query parameters and paginated
 * @param request NextRequest containing PersonFilterSchema for query params.
 * @returns Paginated collection of Person objects
 */
export async function GET(
    request: NextRequest
) { // TODO: Define return type shape

    const url = new URL(request.url);
    const raw = Object.fromEntries(url.searchParams.entries());

    // TODO: maybe move this to getPersons()
    let q: z.infer<typeof PersonFilterSchema>;
    try {
        q = PersonFilterSchema.parse(raw);
    } catch (e) {
        console.log("Error parsing PersonFilterSchema.", e)
        return toErrorResponse(e)
    }

    const session: Session = await getSession()

    try {
        const results = await getPersons(q, session)

        return NextResponse.json(
            { detail: results },
            { status: 200 }
        )

    } catch(error) {
        console.log("Error getting people.", error)
        return toErrorResponse(error)
    } finally {
        await session.close()
    }
}