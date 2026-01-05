import neo4j from "neo4j-driver";
import dotenv from 'dotenv';

dotenv.config(
    { 
        path: '.env' 
    }
);

const URI       = process.env.NEO4J_URI!
const USERNAME  = process.env.NEO4J_USER!
const PASSWORD  = process.env.NEO4J_PASSWORD!

declare global {
    var __neo4jDriver: ReturnType <typeof neo4j.driver> | undefined;
}

export function getDriver() {
    if (!global.__neo4jDriver) {
        global.__neo4jDriver = neo4j.driver(URI, neo4j.auth.basic(USERNAME, PASSWORD))
    }
    return global.__neo4jDriver
}

export async function getSession() {
    const driver = getDriver()
    return driver?.session()
}

export async function closeDriver() {
  if (global.__neo4jDriver) {
    await global.__neo4jDriver.close();
  }
}
