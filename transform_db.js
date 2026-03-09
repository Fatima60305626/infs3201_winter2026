const mongodb = require('mongodb')


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

async function addEmployeeArray(){
    await connectDatabase()
    await shifts.updateMany({},{$set:{employees:[]}})
    

}

async function addEmployees() {
    await connectDatabase()
    let assignmentData = await assignments.find().toArray()
    for(a of assignmentData){
        let employee = await employees.findOne({employeeId:a.employeeId})
        let shift = await shifts.findOne({shiftId: a.shiftId})
        await shifts.updateOne({_id: shift._id},{$push:{employees:employee._id}})

    }


    
}
//db.employees.updateMany({},{$unset:{employeeId: ""}});
//db.shifts.updateMany({},{$unset:{shiftId: ""}});
//db.assignments.drop();
async function main() {
    await addEmployeeArray()
    await addEmployees()
    
}
main()
