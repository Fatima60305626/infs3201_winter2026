const persistence = require("./persistence.js")

async function addEmployeeRecord(emp) {
    let maxId = 0
    let employeeList = await persistence.getAllEmployees()
    for (let e of employeeList) {
        let eid = Number(e.employeeId.slice(1))
        if (eid > maxId) {
            maxId = eid
        }
    }
    emp.employeeId = `E${String(maxId+1).padStart(3,'0')}`
    employeeList.push(emp)
    await persistence.addEmployeeRecord(employeeList)
}

async function getEmployeeShifts(empId) {
    return await persistence.getEmployeeShifts(empId)
    
}

async function getAllEmployees() {
    return await persistence.getAllEmployees()
    
}
async function assignShift(empId, shiftId) {
    return await persistence.assignShift(empId, shiftId)
}



module.exports = {addEmployeeRecord, getEmployeeShifts,getAllEmployees, assignShift}