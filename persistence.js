const mongodb = require('mongodb')
let fs = require("fs/promises")

let client = undefined
let db = undefined
let shifts = undefined
let assignments = undefined
let employees = undefined

/**
 * Connect to MongoDB
 */
async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient("mongodb+srv://60305626:12class34@s-60305626.izf0a7o.mongodb.net/")
        await client.connect()
        db = client.db('infs3201_winter2026')
        shifts = db.collection("shifts")
        assignments = db.collection("assignments")
        employees = db.collection("employees")
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
    let employee = await employees.findOne({ employeeId: empId })
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
    let shift = await shifts.findOne({ shiftId: shiftId })
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

    let assignmentList = await assignments.find({ employeeId: empId }).toArray()

    let shiftIds = []
    for (let a of assignmentList) {
        shiftIds.push(a.shiftId)
    }

    let shiftDetails = await shifts.find({ shiftId: { $in: shiftIds } }).toArray()

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
   await employees.updateOne({
    employeeId: empId},{$set:{name:name, phone:phone}})
    
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
    updateEmployee
}