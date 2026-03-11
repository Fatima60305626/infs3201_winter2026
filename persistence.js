const mongodb = require('mongodb')
let fs = require("fs/promises")


let client = undefined
let db = undefined
let shifts = undefined
let employees = undefined
let sessions = undefined
let users = undefined

/**
 * Connect to MongoDB
 */
async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient("mongodb+srv://60305626:12class34@s-60305626.izf0a7o.mongodb.net/")
        await client.connect()
        db = client.db('infs3201_winter2026')
        shifts = db.collection("shifts")
        employees = db.collection("employees")
        sessions = db.collection("sessions")
        users = db.collection("users")

    }
}

/**
 * Return a list of all employees loaded from the file.
 * @returns {Array<{ employeeId: string, name: string, phone: string }>} List of employees
 */
async function getAllEmployees() {
    await connectDatabase()
    let result = await employees.find().toArray()
    return result
}

/**
 * Return a list of all assignments loaded from the file.
 * @returns {Array<{}>} 
 */
async function getAllAssignments() {
    await connectDatabase()
    let result = await assignments.find().toArray()
    return result
}

/**
 * Return the max daily hours limit loaded from the file.
 * @returns maxDailyHours 
 */
async function getMaxDailyHours() {
    let rawData = await fs.readFile('config.json')
    result = JSON.parse(rawData)
    return result.maxDailyHours
}

/**
 * Find a single employee given their ID number.
 * @param {string} empId 
 * @returns {{ employeeId: string, name: string, phone: string }|undefined}
 */
async function findEmployee(empId) {
    await connectDatabase()
    let employeeId = new mongodb.ObjectId(empId)
    let employee = await employees.findOne({ _id: employeeId })
    if (employee){
        return employee
    }
    return undefined
}

/**
 * Get a single shift given the shiftId
 * @param {string} shiftId 
 * @returns {{shiftId:string, date:string, startTime:string, endTime:string}|undefined}
 */
async function findShift(shiftId) {
    await connectDatabase()
    let shiftObjectId = new mongodb.ObjectId(shiftId)
    let shift = await shifts.findOne({ _id: shiftObjectId })
    if (shift){
        return shift
    }
    return undefined
}

/**
 * Get a list of shiftIDs for an employee.
 * @param {string} empId 
 * @returns {Array<{string}>}
 */
async function getEmployeeShifts(empId) {
    await connectDatabase()
    let employeeId = new mongodb.ObjectId(empId)
    let shiftDetails = await shifts.find({employees: employeeId}).toArray()

    return shiftDetails
}

/**
 * Find a shift object give the employeeId and the shiftId.
 * @param {string} empId 
 * @param {string} shiftId 
 * @returns {{employeeId:string, shiftId:string}|undefined}
 */
async function findAssignment(empId, shiftId) {
    await connectDatabase()
    let assignment = await assignments.findOne({
        employeeId: empId,
        shiftId: shiftId
    })
    if (assignment){
        return assignment
    }
    return undefined
}

/**
 * Add a new employee record to the system. The empId is automatically generated based
 * on the next available ID number from what is already in the file.
 * @param {{name:string, phone:string}} emp 
 */
async function addEmployeeRecord(emp) {
    await connectDatabase()

    await employees.insertOne(emp)
}

/**
 * Updates an employee's name and phone number.
 *
 * @async
 * @function updateEmployee
 * @param {string} empId - The unique identifier of the employee
 * @param {string} name - The updated employee name
 * @param {string} phone - The updated phone number (format: 0000-0000)
 */
async function updateEmployee(empId, name, phone) {
   await connectDatabase()

   let employeeId = new mongodb.ObjectId(empId)
   await employees.updateOne({_id: employeeId},{$set:{name:name, phone:phone}})
    
}

/**
 * Saves a session in the database.
 * @param {string} uuid - The unique session key.
 * @param {Date} expiry - The expiry date of the session.
 * @param {Object} data - The session data.
 */
async function saveSession(uuid, expiry, data) {
    await connectDatabase()
    await session.insertOne({
        SessionKey: uuid,
        Expiry: expiry,
        Data: data
    })
}

/**
 * Retrieves session data based on the session key.
 * @param {string} key - The session key.
 * @returns {Object} - Returns the session data if found, otherwise null.
 */
async function getSessionData(key) {
    await connectDatabase()
    let result = await session.find({ SessionKey: key })
    let resultData = await result.toArray()
    return resultData[0]
}

/**
 * Deletes a session from the database based on the session key.
 * @param {string} key - The session key.
 */
async function deleteSession(key) {
    await session.deleteOne({ SessionKey: key })
}

/**
 * Retrieves user details based on the provided username.
 * @param {string} username - The username to look up.
 * @returns {Object} - Returns the user details if found, otherwise null.
 */
async function getUserDetails(username) {
    await connectDatabase()
    let result = await users.find({ username: username })
    let resultData = await result.toArray()
    return resultData[0]
}
async function extendSession(sessionId) {
    let newExpiry = new Date(Date.now()+5*60*1000)
    await sessions.updateOne({uuid:sessionId}, {$set:{expiry:newExpiry}})
    
}

module.exports = { 
    getAllEmployees, 
    getEmployeeShifts, 
    addEmployeeRecord, 
    findAssignment, 
    findShift, 
    findEmployee, 
    getAllAssignments, 
    getMaxDailyHours,
    updateEmployee,
    saveSession,
    getSessionData,
    deleteSession,
    getUserDetails,
    extendSession

}