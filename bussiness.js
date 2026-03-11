const persistence = require("./persistence.js")
const crypto = require("crypto")

/**
 * Adds a new employee record and Generates a unique employee ID 
 * in the format "E###" based on the highest existing employee ID, 
 * then stores the updated list.
 *
 * @param {Object} emp - The employee object to be added.
 * @returns {Promise<void>} Resolves when the employee record is successfully stored.
 */
async function addEmployeeRecord(emp) {
    let maxId = 0
    let employeeList = await persistence.getAllEmployees()
    for (let e of employeeList) {
        let eid = Number(e.employeeId.slice(1))
        if (eid > maxId) {
            maxId = eid
        }
    }
    emp.employeeId = `E${String(maxId + 1).padStart(3, '0')}`
    await persistence.addEmployeeRecord(emp)
}

/**
 * Retrieves all shift assignments for a specific employee.
 *
 * @param {string} empId - The ID of the employee.
 * @returns {Promise<Array>} A promise that resolves to a list of shifts assigned to the employee.
 */
async function getEmployeeShifts(empId) {
    return await persistence.getEmployeeShifts(empId)

}

/**
 * Retrieves all employees from the persistence layer.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of all employee records.
 */
async function getAllEmployees() {
    return await persistence.getAllEmployees()

}

/**
 * Find a single employee given their ID number.
 * @param {string} empId 
 * @returns {{ employeeId: string, name: string, phone: string }|undefined}
 */
async function findEmployee(empId) {
   
    return persistence.findEmployee(empId)
}

/**
 * Updates an employee's name and phone number.
 *
 * @async
 * @function updateEmployee
 * @param {string} empId - The unique identifier of the employee
 * @param {string} name - The updated employee name
 * @param {string} phone - The updated phone number (format: 0000-0000)
 * @returns {Promise<void>} Resolves when the employee is successfully updated
 */
async function updateEmployee(empId, name, phone) {
    await persistence.updateEmployee(empId, name , phone)
}

/**
 * Validates user credentials by checking username, password, and account verification status.
 * @param {string} username - The username of the user.
 * @param {string} password - The plain-text password of the user.
 * @returns {Object} - Returns user details if credentials are valid; otherwise, false.
 */
async function validateCredentials(username, password) {
    let check = await persistence.getUserDetails(username)
    let hash = crypto.createHash('sha256')
    hash.update(password)
    let hashedPassword = hash.digest('hex')
    if (!check) {
        return false
    }
    if (check.verified === false) {
        return false
    }
    if (check.password != hashedPassword) {
        return false
    }
    return check
}

/**
 * Starts a new user session by generating a UUID and setting an expiry time.
 * @param {Object} data - Session data including username and user type.
 * @returns {Object} - The session UUID and expiry date.
 */
async function startSession(data) {
    let uuid = crypto.randomUUID()
    let expiry = new Date(Date.now() + 1000 * 60 * 5)
    await persistence.saveSession(uuid, expiry, data)
    return {
        uuid: uuid,
        expiry: expiry
    }
}


/**
 * Retrieves session data based on the provided session key.
 * @param {string} key - The session key (UUID).
 * @returns {Object} - The session data found.
 */
async function getSessionData(key) {
    return await persistence.getSessionData(key)
}

/**
 * Deletes a session based on the provided session key.
 * @param {string} key - The session key (UUID).
 */
async function deleteSession(key) {
    await persistence.deleteSession(key)
}

async function extendSession(sessionId) {
    await persistence.extendSession(sessionId)
    
}


module.exports = { addEmployeeRecord, getEmployeeShifts, getAllEmployees, 
    findEmployee, updateEmployee,
    validateCredentials,startSession,
     getSessionData,deleteSession,extendSession
}