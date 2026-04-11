const mongodb = require('mongodb')
let fs = require("fs/promises")

const email = require ('./emailSystem')

let client = undefined
let db = undefined
let shifts = undefined
let employees = undefined
let sessions = undefined
let users = undefined
let securityLogs =undefined
/**
 * Connect to MongoDB
 */
async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient("mongodb+srv://fatima:12class34@cluster0.5lmylzn.mongodb.net/")
        await client.connect()
        db = client.db('infs3201_winter2026')
        shifts = db.collection("shifts")
        employees = db.collection("employees")
        sessions = db.collection("sessions")
        users = db.collection("users")
        securityLogs = db.collection("security_log")

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
    await sessions.insertOne({
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
    let result = await sessions.findOne({ SessionKey: key })
   
    return result
}

/**
 * Deletes a session from the database based on the session key.
 * @param {string} key - The session key.
 */
async function deleteSession(key) {
    await connectDatabase()
    await sessions.deleteOne({ SessionKey: key })
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

/**
 * Extends the expiry time of a session by 5 minutes.
 * Connects to the database and updates the session record.
 *
 * @async
 * @function
 * @param {string} sessionId - Unique session identifier (SessionKey)
 * @returns {Promise<void>}
 */
async function extendSession(sessionId) {
    await connectDatabase()

    let newExpiry = new Date(Date.now()+5*60*1000)
    await sessions.updateOne({SessionKey:sessionId}, {$set:{Expiry:newExpiry}})
    
}

/**
 * Inserts a security log entry into the database.
 * Stores information about user actions.
 *
 * @async
 * @function
 * @param {Object} log - Log object containing request details
 * @param {Date} log.timestamp - Time when the action occurred
 * @param {string} log.username - Username performing the action
 * @param {string} log.url - Requested URL
 * @param {string} log.method - HTTP method used (GET, POST)
 * @returns {Promise<void>}
 */
async function addSecurityLog(log) {
    await connectDatabase()
    await securityLogs.insertOne(log)
}
/**
 * Generates and stores a verification code for a user,
 * along with an expiry time 
 * (default: 3 minutes from creation)
 * 
 * Creates an expiry timestamp 
 * (current time + 3 minutes)
 * Updates the user record with the new code and expiry time
 * 
 * @param {string} username - The username of the user
 * @param {string} code - The verification code to be stored
 * 
 */
async function addCode(username, code) {
    await connectDatabase()
    let codeExpiry = new Date(Date.now() + 1000 * 60 * 3)
    await users.updateOne({username: username},{$set:{code : code, codeExpiry: codeExpiry}})
    
}
/**
 * Validates a user's verification code.
 * 
 * Retrieves the user by username. Checks if the verification code has expired
 * If valid, Resets failed attempts and Removes stored code and expiry
 * If invalid, Increments failed attempts, Sends warning email after multiple 
 * failures and Blocks account after too many attempts
 * 
 * @param {string} username - The username of the user attempting verification
 * @param {string} code - The verification code provided by the user
 * 
 * @returns Returns true if the code is valid and verification succeeds, otherwise false
 * 
 */
async function validateCode(username, code) {
    await connectDatabase()
    let user= await users.findOne({username: username})
    if(new Date()> new Date(user.codeExpiry)){
        await users.updateOne({username: username}, {$unset: {code:"", codeExpiry: ""}})
        return false
    }
    if (user.code == code && user.blockAccount == false){
        await users.updateOne({username:username}, {$set:{failedAttempt: 0},$unset: {code:"", codeExpiry: ""}})
        return true
    }

    else{
        await users.updateOne({username:username}, {$inc:{failedAttempt: 1}})
        if(user.failedAttempt == 2){
           await email.sendEmailFailedAttempt(username)
            

        }
        if(user.failedAttempt == 9){
            await users.updateOne({username:username}, {$set:{blockAccount: true}})
        }
       
        return false
    }
}


module.exports = { 
    getAllEmployees, 
    getEmployeeShifts, 
    findShift, 
    findEmployee,  
    getMaxDailyHours,
    updateEmployee,
    saveSession,
    getSessionData,
    deleteSession,
    getUserDetails,
    extendSession,
    addSecurityLog,
    addCode,
    validateCode
}