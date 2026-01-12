import { getSession } from "@/lib/db/neo4j";
import { Session } from "neo4j-driver";
import { NextRequest, NextResponse } from "next/server";
import { getSpouses } from "@/lib/pedigree/spouse";
import { toErrorResponse } from "@/lib/errors/error";



/**
 * Gets the Spouse objects for a specific Person
 * @param request NextRequest
 * @param param1 personId UUID string to get spouses for
 * @returns NextResponse of Person (Spouse) objects on success
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ personId: string }> }
) {
    const session: Session = await getSession()

    try {

        const id: string = (await params).personId

        const result = await getSpouses(id, session)
        
        return NextResponse.json(
            { detail: result },
            { status: 200 }
        )

    } catch (error) {
        console.log("Error getting spouse.", error)
        return toErrorResponse(error)
    } finally {
        await session.close()
    }
}