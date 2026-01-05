import { Person } from "@/lib/domain/person";
import { findPersonById } from "@/lib/pedigree/person";
import { getSession } from "@/lib/db/neo4j";
import { NextRequest, NextResponse } from "next/server";
import { Session } from "neo4j-driver";
import { toErrorResponse } from "@/lib/errors/error";


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    
    const id: string = (await params).id;
    const session: Session = await getSession()
    
    try {
    
        const result: Person = await findPersonById(id, session)

        return NextResponse.json(
            { detail: result },
            { status: 200 }
        )
    
    } catch (error) {
        console.log("Error getting Person by ID:", error)

        return toErrorResponse(error)
    } finally {
        await session.close()
    }
}