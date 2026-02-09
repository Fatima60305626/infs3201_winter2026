const persistence = require("./persistence.js")

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
    employeeList.push(emp)
    await persistence.addEmployeeRecord(employeeList)
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
 * This function attempts to assign a shift to an employee. This function checks to ensure
 * that the employee exists, the shift exists, and that the combination employee/shift has 
 * not already been recorded. It also checks that the employee shift does not exceed the max
 * daily limit for a day which is 9 hours.
 * 
 * The function currently returns string messages indicating whether the operation was successful
 * or why it failed.
 * 
 * @param {string} empId 
 * @param {string} shiftId 
 * @returns {string} A message indicating the problem of the word "Ok"
 */
async function assignShift(empId, shiftId) {
    // check that empId exists
    let employee = await persistence.findEmployee(empId)
    if (!employee) {
        return "Employee does not exist"
    }
    // check that shiftId exists
    let shift = await persistence.findShift(shiftId)
    if (!shift) {
        return "Shift does not exist"
    }
    // check that empId,shiftId doesn't exist
    let assignment = await persistence.findAssignment(empId, shiftId)
    if (assignment) {
        return "Employee already assigned to shift"
    }

    let assignments = await persistence.getAllAssignments()
    let totalHours = 0

    // get all shifts for this employee on same date
    for (let a of assignments) {
        if (a.employeeId === empId) {
            let sh = await persistence.findShift(a.shiftId)

            if (sh && sh.date === shift.date) {
                totalHours += computeShiftDuration(sh.startTime, sh.endTime)
            }
        }
    }

    // duration of new shift
    let newShiftHours = computeShiftDuration(shift.startTime, shift.endTime)

    let maxDailyHours = await persistence.getMaxDailyHours()
    // check max daily hours
    if (totalHours + newShiftHours > maxDailyHours) {
        return "Daily hour limit exceeded"
    }


    // add empId,shiftId into the bridge
    await persistence.addAssignment(empId, shiftId)
    return "Ok"
}


/**
 * LLM Generated Function
 * Prompt used:
 * "Write a function computeShiftDuration(startTime, endTime)
 * that returns hours as a number. for example: 11:00 to 17:00= 6"
 */
function computeShiftDuration(startTime, endTime) {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)

    const start = sh + sm / 60
    const end = eh + em / 60

    return end - start
}



module.exports = { addEmployeeRecord, getEmployeeShifts, getAllEmployees, assignShift }