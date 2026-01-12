import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/db/neo4j";
import { Session } from "neo4j-driver";
import { getParents } from "@/lib/pedigree/parent";
import { toErrorResponse } from "@/lib/errors/error";


// /**
//  * PUT endpoint to create a new Person-Parent relationship. 
//  * Uses personId from path, parentId in request
//  * @param request NextRequest containing parentId UUID string
//  * @param param1 personId UUID string
//  * @returns Child and Parents
//  */
// export async function POST(
//     request: NextRequest,
//     { params }: { params: Promise<{ personId: string }> },
// ) { // TODO: Define return type shape
//     const session: Session = await getSession()
//     try {
        
//         const id: string = (await params).personId;
//         const data = await request.json()

//         const res = await setParent(
//             id,
//             data.parentId,
//             session
//         )

//         return NextResponse.json(
//             { detail: res },
//             { status: 201 }
//         )

//     } catch (error) {
//         console.log("Error creating relationship.", error)
//         return toErrorResponse(error)
//     } finally {
//         await session.close()
//     }
// }


/**
 * Gets the Parent objects for a specific Person
 * @param request NextRequest
 * @param param1 personId UUID string to get parents for
 * @returns NextResponse of Person objects on success
 */
export async function GET(
    request:  NextRequest,
    { params }: { params: Promise<{ personId: string }> }
) { // TODO: Define return type shape

    const session: Session = await getSession()

    try {

        const id: string = (await params).personId

        const result = await getParents(id, session)

        return NextResponse.json(
            { detail: result },
            { status: 200 }
        )

    } catch (error) {
        console.log("Error getting parents.", error)
        toErrorResponse(error)
    } finally {
        await session.close()
    }
}