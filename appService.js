const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');

const envVariables = loadEnvFile('./.env');

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
    user: envVariables.ORACLE_USER,
    password: envVariables.ORACLE_PASS,
    connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`
};


async function getAnimals() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM AnimalAdmits');
        console.log(result);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function getApplications() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM Applies');
        console.log(result);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function submitApplication(branchID, adopterID, animalID, applicationStatus, applicationDate) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO Applies(branchID, adopterID, animalID, applicationStatus, applicationDate) 
            VALUES(:branchID, :adopterID, :animalID, :applicationStatus, TO_DATE(:applicationDate, 'YYYY-MM-DD'))`,
            { branchID, adopterID, animalID, applicationStatus, applicationDate },
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function withdrawApplication(branchID, adopterID, animalID) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `DELETE FROM Applies 
             WHERE branchID = :branchID AND adopterID = :adopterID AND animalID = :animalID`,
            { branchID, adopterID, animalID },
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function updateApplication(branchID, adopterID, animalID, applicationStatus, applicationDate) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE Applies 
             SET applicationStatus = :applicationStatus,
                 applicationDate = TO_DATE(:applicationDate, 'YYYY-MM-DD')
             WHERE branchID = :branchID AND adopterID = :adopterID AND animalID = :animalID`,
            { branchID, adopterID, animalID, applicationStatus, applicationDate },
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}


// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}


// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
    return await withOracleDB(async (connection) => {
        return true;
    }).catch(() => {
        return false;
    });
}

async function fetchDemotableFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM DEMOTABLE');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function initiateDemotable() {
    return await withOracleDB(async (connection) => {
        try {
            await connection.execute(`DROP TABLE DEMOTABLE`);
        } catch(err) {
            console.log('Table might not exist, proceeding to create...');
        }

        const result = await connection.execute(`
            CREATE TABLE DEMOTABLE (
                id NUMBER PRIMARY KEY,
                name VARCHAR2(20)
            )
        `);
        return true;
    }).catch(() => {
        return false;
    });
}

async function insertDemotable(id, name) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO DEMOTABLE (id, name) VALUES (:id, :name)`,
            [id, name],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function updateNameDemotable(oldName, newName) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE DEMOTABLE SET name=:newName where name=:oldName`,
            [newName, oldName],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function countDemotable() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT Count(*) FROM DEMOTABLE');
        return result.rows[0][0];
    }).catch(() => {
        return -1;
    });
}

module.exports = {
    testOracleConnection,
    fetchDemotableFromDb,
    initiateDemotable, 
    insertDemotable, 
    updateNameDemotable, 
    countDemotable,
    getAnimals,
    getApplications,
    submitApplication,
    withdrawApplication,
    updateApplication
};