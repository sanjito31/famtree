import { Integer, Session, Node } from "neo4j-driver";
import { AppError, HttpStatus } from "../errors/error";
import { toPerson } from "../domain/person";


export async function setParent(
    childId: string,
    parentId: string,
    session: Session
) { // TODO: Define return type shape

    if (childId === parentId) {
        throw new AppError("Person cannot be their own parent.", HttpStatus.VALIDATION_ERROR)
    }
    
    const cypher = `
        MATCH (child:Person { id: $childId })
        OPTIONAL MATCH (parent:Person { id: $parentId })

        OPTIONAL MATCH (existing:Person)-[:PARENT_OF]->(child)
        WITH child, parent, count(existing) AS parentCount

        OPTIONAL MATCH (parent)-[existingRel:PARENT_OF]->(child)
        WITH child, parent, parentCount, existingRel IS NOT NULL AS relationshipExists

        FOREACH (_ IN CASE WHEN parent IS NOT NULL AND parentCount < 2 AND NOT relationshipExists THEN [1] ELSE [] END |
            MERGE (parent)-[:PARENT_OF]->(child)
        )
        RETURN 
            child IS NOT NULL AS childExists,
            parent IS NOT NULL AS parentExists,
            parentCount,
            relationshipExists,
            child AS child,
            parent AS parent
        `;

    const params = {
        childId: childId,
        parentId: parentId
    }


    const result = await session.executeWrite(async (tx) => {
        return tx.run(cypher, params)
    })

    const record = result.records[0]

    if (!record) {
        throw new AppError("Child not found", HttpStatus.NOT_FOUND);
    }

    if (!record.get("parentExists")) {
        throw new AppError("Parent not found", HttpStatus.NOT_FOUND);
    }

    if (record.get("relationshipExists")) {
        throw new AppError("Parent relationship already exists", HttpStatus.CONFLICT);
    }

    if (record.get("parentCount") >= 2) {
        throw new AppError("A person cannot have more than two parents.", HttpStatus.VALIDATION_ERROR);
    }

    return {
        child: toPerson(record.get("child").properties),
        parent: toPerson(record.get("parent").properties),
        parentCount: Integer.toNumber(record.get("parentCount"))
    }
}



export async function getParents(
    childId: string,
    session: Session
) { // TODO: Define return type shape

    const cypher = `
        MATCH (child:Person { id: $childId })
        OPTIONAL MATCH (parent:Person)-[:PARENT_OF]->(child)
        RETURN 
            child,
            collect(parent) AS parents
        `;

    const params = {
        childId: childId
    }

    const res = await session.executeRead(async (tx) => {
        return tx.run(cypher, params)
    })

    const record = res.records[0]
    
    if (!record) {
        throw new AppError("Person not found", HttpStatus.NOT_FOUND);
    }

    const childNode = record.get("child") as Node;
    const parentNodes = record.get("parents") as Node[];

    return {
        child: toPerson(childNode.properties),
        parents: parentNodes.map((p) => toPerson(p.properties)),
    };
    
}


export async function deleteParentRelationship(
    personId: string,
    parentId: string,
    session: Session
) { // TODO: Define return type shape

    const cypher: string = `
        MATCH (child:Person { id: $childId })
        OPTIONAL MATCH (parent:Person { id: $parentId })

        OPTIONAL MATCH (parent)-[r:PARENT_OF]->(child)
        DELETE r

        RETURN 
            child IS NOT NULL AS childExists,
            parent IS NOT NULL AS parentExists,
            r IS NOT NULL AS relationshipExisted
        `;

    const params = {
        childId: personId,
        parentId: parentId
    }

    const res = await session.executeWrite(async (tx) => {
        return tx.run(cypher, params)
    })

    const records = res.records[0]

    if (!records?.get("childExists")){
        throw new AppError("Child not found.", HttpStatus.NOT_FOUND)
    }

    if (!records?.get("parentExists")) {
        throw new AppError("Parent not found.", HttpStatus.NOT_FOUND)
    }

    if (!records?.get("relationshipExisted")) {
        throw new AppError("Relationship not found.", HttpStatus.NOT_FOUND)
    }

    const deletedCount: number = res.summary.counters.updates().relationshipsDeleted

    return deletedCount

}