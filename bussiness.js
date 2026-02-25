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



module.exports = { addEmployeeRecord, getEmployeeShifts, getAllEmployees }