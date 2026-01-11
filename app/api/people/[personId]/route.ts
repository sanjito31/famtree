import { Person, PersonEditSchema } from "@/lib/domain/person";
import { findPersonById, editPerson, deletePerson } from "@/lib/pedigree/person";
import { getSession } from "@/lib/db/neo4j";
import { NextRequest, NextResponse } from "next/server";
import { Session } from "neo4j-driver";
import { toErrorResponse } from "@/lib/errors/error";


/**
 * Get the information about a specific person by ID
 * @param request NextRequest
 * @param param1 personId UUID string
 * @returns NextResponse of Person object on success
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ personId: string }> },
) { // TODO: Define return type shape
    
    const id: string = (await params).personId;
    const session: Session = await getSession()
    
    try {
    
        const result: Person = await findPersonById(id, session)

        return NextResponse.json(
            { detail: result },
            { status: 200 }
        )
    
    } catch (error) {
        console.log("Error getting Person by ID.", error)
        return toErrorResponse(error)
    } finally {
        await session.close()
    }
}


/**
 * Updates fields for a specific Person by ID.
 * @param request NextRequest with PersonEditSchema information
 * @param param1 personId UUID string
 * @returns NextResponse of updated Person object on success
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ personId: string }> },
) { // TODO: Define return type shape

    const session: Session = await getSession()
    
    try {
        const id: string = (await params).personId;
        const data = await request.json()

        // TODO: Move this schema validation into the editPerson function
        const updatedPerson = PersonEditSchema.parse({
            id,
            ...data
        })
        
        const result = await editPerson(updatedPerson, session)

        return NextResponse.json( 
            { detail: result }, 
            { status: 201 } 
        )

    } catch (error) {
        console.log("Error updating Person.", error)        
        return toErrorResponse(error)
    } finally {
        await session.close()
    }
}


/**
 * Delete a specific Person node by ID
 * @param request NextRequest
 * @param param1 personId UUID string
 * @returns NextResponse of Person deleted
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ personId: string }> },
) { // TODO: Define return type shape
	const session: Session = await getSession()

  	try {
        const id: string = (await params).personId;

        const res = await deletePerson(id, session)

        return NextResponse.json(
            { detail: { "deleted": res }},
            { status: 200 }
        )

  	} catch (error) {
        console.log("Failed to delete record.", error)
        return toErrorResponse(error)
  	} finally {
        await session.close()
  	}

}