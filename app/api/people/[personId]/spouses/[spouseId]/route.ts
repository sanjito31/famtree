import { getSession } from "@/lib/db/neo4j";
import { toErrorResponse } from "@/lib/errors/error";
import { deleteSpousalRelationship, setSpouse } from "@/lib/pedigree/spouse";
import { Session } from "neo4j-driver";
import { NextRequest, NextResponse } from "next/server";


/**
 * PUT endpoint to create a new Spousal relationship. Uses IDs from path
 * @param request NextRequest
 * @param param1 personId UUID string, spouseId UUID string
 * @returns Person and Spouse
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ personId: string, spouseId: string }> }
) { // TODO: Define return type shape
    
    const session: Session = await getSession()
    try {
        
        const personId: string = (await params).personId;
        const spouseId: string = (await params).spouseId;

        const res = await setSpouse(
            personId,
            spouseId,
            session
        )

        return NextResponse.json(
            { detail: res },
            { status: 201 }
        )

    } catch (error) {
        console.log("Error creating spousal relationship.", error)
        return toErrorResponse(error)
    } finally {
        await session.close()
    }
}



/**
 * DELETE endpoint to delete spousal relationship
 * @param request NextRequest
 * @param param1 personId UUID string, spouseId UUID string
 * @returns Nothing on success
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ personId: string, spouseId: string }> }
) { // TODO: Define return type shape

    const session: Session = await getSession()

    try {
        const personId: string = (await params).personId
        const spouseId: string = (await params).spouseId


        await deleteSpousalRelationship(
            personId,
            spouseId,
            session
        )

        return NextResponse.json(
            { status: 204 }
        )

    } catch (error) {
        console.log("Error deleting spousal relationship.", error)
        return toErrorResponse(error)
    } finally {
        await session.close()
    }
}