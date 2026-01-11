import { NextRequest, NextResponse } from "next/server";
import { Session } from "neo4j-driver";
import { getSession } from "@/lib/db/neo4j";
import { setParent, deleteParentRelationship } from "@/lib/pedigree/parent";
import { toErrorResponse } from "@/lib/errors/error";


/**
 * PUT endpoint to create a new Person-Parent relationship. Uses IDs from path
 * @param request NextRequest
 * @param param1 personId UUID string, parentId UUID string
 * @returns Child and Parents
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ personId: string, parentId: string }> },
) { // TODO: Define return type shape
    
    const session: Session = await getSession()
    try {
        
        const personId: string = (await params).personId;
        const parentId: string = (await params).parentId;

        const res = await setParent(
            personId,
            parentId,
            session
        )

        return NextResponse.json(
            { detail: res },
            { status: 201 }
        )

    } catch (error) {
        console.log("Error creating parental relationship.", error)
        return toErrorResponse(error)
    } finally {
        await session.close()
    }
}


/**
 * DELETE endpoint to delete Parent-Person relationship
 * @param request NextRequest
 * @param param1 personId UUID string, parentId UUID string
 * @returns Nothing on success
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ personId: string, parentId: string }> }
) { // TODO: Define return type shape

    const session: Session = await getSession()

    try {
        const personId: string = (await params).personId
        const parentId: string = (await params).parentId


        await deleteParentRelationship(
            personId,
            parentId,
            session
        )

        return NextResponse.json(
            { status: 204 }
        )

    } catch (error) {
        console.log("Error deleting parental relationship.", error)
        return toErrorResponse(error)
    } finally {
        await session.close()
    }
}