import { Session, Node } from "neo4j-driver";
import { AppError, HttpStatus } from "../errors/error";
import { toPerson } from "../domain/person";


export async function getSpouses(
    personId: string,
    session: Session
) { // TODO: Define return type shape
    
    const cypher: string = 
        `
            MATCH (person:Person { id: $id })
            OPTIONAL MATCH (spouse:Person)-[:SPOUSE_OF]-(person)
            RETURN 
                person,
                collect(spouse) AS spouses
        `;

    const params = {
        id: personId
    }

    const res = await session.executeRead(async (tx) => {
        return tx.run(cypher, params)
    })

    const record = res.records[0]
    
    if (!record) {
        throw new AppError("Person not found", HttpStatus.NOT_FOUND);
    }

    const personNode = record.get("person") as Node;
    const spouseNodes = record.get("spouses") as Node[];

    return {
        person: toPerson(personNode.properties),
        spouses: spouseNodes.filter(Boolean).map((p) => toPerson(p.properties)),
    };
}


export async function setSpouse(
    personId: string,
    spouseId: string,
    session: Session
) { // TODO: Define return type shape

    if (personId === spouseId) {
        throw new AppError("Person cannot be their own spouse.", HttpStatus.VALIDATION_ERROR)
    }
    
    const cypher = `
        MATCH (person:Person { id: $personId })
        OPTIONAL MATCH (spouse:Person { id: $spouseId })

        OPTIONAL MATCH (person)-[existingRel:SPOUSE_OF]-(spouse)

        FOREACH (_ IN CASE WHEN spouse IS NOT NULL AND existingRel IS NULL THEN [1] ELSE [] END |
            MERGE (person)-[:SPOUSE_OF]->(spouse)
        )

        RETURN 
            person IS NOT NULL AS personExists,
            spouse IS NOT NULL AS spouseExists,
            existingRel IS NOT NULL AS relationshipExists,
            person AS person,
            spouse AS spouse
        `;

    const params = {
        personId: personId,
        spouseId: spouseId
    };


    const result = await session.executeWrite(async (tx) => {
        return tx.run(cypher, params)
    })

    const record = result.records[0]

    if (!record) {
        throw new AppError("Person not found", HttpStatus.NOT_FOUND);
    }

    if (!record.get("spouseExists")) {
        throw new AppError("Spouse not found", HttpStatus.NOT_FOUND);
    }

    if (record.get("relationshipExists")) {
        throw new AppError("Spouse relationship already exists", HttpStatus.CONFLICT);
    }

    return {
        person: toPerson(record.get("person").properties),
        spouse: toPerson(record.get("spouse").properties)
    }
}



export async function deleteSpousalRelationship(
    personId: string,
    spouseId: string,
    session: Session
) { // TODO: Define return type shape

    const cypher = `
        MATCH (person:Person { id: $personId })
        OPTIONAL MATCH (spouse:Person { id: $spouseId })

        OPTIONAL MATCH (person)-[r:SPOUSE_OF]-(spouse)
        DELETE r

        RETURN 
            person IS NOT NULL AS personExists,
            spouse IS NOT NULL AS spouseExists,
            r IS NOT NULL AS relationshipExisted
    `;

    const params = {
        personId: personId,
        spouseId: spouseId
    };

    const res = await session.executeWrite(async (tx) => {
        return tx.run(cypher, params)
    });

    const record = res.records[0];

    if (!record?.get("personExists")) {
        throw new AppError("Person not found.", HttpStatus.NOT_FOUND);
    }

    if (!record?.get("spouseExists")) {
        throw new AppError("Spouse not found.", HttpStatus.NOT_FOUND);
    }

    if (!record?.get("relationshipExisted")) {
        throw new AppError("Relationship not found.", HttpStatus.NOT_FOUND);
    }

    return res.summary.counters.updates().relationshipsDeleted;
}