import { getDriver } from "@/lib/db/neo4j"


async function testConnection() {
  
    const driver = getDriver()

    try {

        if (!driver) throw new Error("Failed to create driver.")

        // Verify connectivity
        await driver.verifyConnectivity();
        console.log('Connection successful!');

        // Run a simple query
        const session = driver.session();
        const result = await session.run('RETURN "Hello from Neo4j!" as message');
        console.log('Query result:', result.records[0].get('message'));
        await session.close();

        // Get database info
        const infoSession = driver.session();
        const dbInfo = await infoSession.run('CALL dbms.components() YIELD name, versions');
        console.log('Neo4j version:', dbInfo.records[0].get('versions')[0]);
        await infoSession.close();

    } catch (error) {
        console.error('Connection failed:', error.message);
    } finally {
        if (driver){
            await driver.close();
        }
    }
}

testConnection();