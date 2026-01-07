import { Person, PersonEditSchema } from "@/lib/domain/person";
import { findPersonById, editPerson } from "@/lib/pedigree/person";
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {

  const session: Session = await getSession()
  try {
    
    const id: string = (await params).id;
    const data = await request.json()

    const updatedPerson = PersonEditSchema.parse({
      id,
      ...data
    })
    
    const result = await editPerson(updatedPerson, session)

    return NextResponse.json( 
      { detail: result }, 
      {status: 201} 
    )

  } catch (error) {
    console.log("Error: ", error)
    return NextResponse.json( 
      { detail: error },
      { status: 400 })
  } finally {
    await session.close()
  }
}