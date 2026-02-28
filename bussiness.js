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


module.exports = { addEmployeeRecord, getEmployeeShifts, getAllEmployees, findEmployee, updateEmployee}