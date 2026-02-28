const express = require("express")
const handlebars = require("express-handlebars")
const business = require("./bussiness")

const app = express()
app.set('views', __dirname + "/templates")

app.engine("handlebars", handlebars.engine())
app.set("view engine", "handlebars")



app.use(express.urlencoded({ extended: true }))

/**
 * GET /
 * Retrieves all employees and renders the home page.
 *
 * @async
 * @function
 * @returns {Promise<void>}
 */
app.get("/", async(req, res) => {

  let employees = await business.getAllEmployees()

  res.render("home", { employees: employees,layout:undefined })

});


/**
 * GET /employee/:id
 * Retrieves a specific employee and their shifts,
 * sorts shifts by date and start time,
 * determines whether each shift is morning or not,
 * and renders the detail page.
 *
 * @async
 * @function
 * @returns {Promise<void>}
 */
app.get("/employee/:id", async(req, res) => {

  let employee = await business.findEmployee(req.params.id)

  if (!employee) {
    return res.send("Employee not found")
  }

  let shifts = await business.getEmployeeShifts(req.params.id)


  for (let i = 0; i < shifts.length - 1; i++) {

    for (let j = 0; j < shifts.length - 1 - i; j++) {

      // Compare date first
      if (shifts[j].date > shifts[j + 1].date) {

        let temp = shifts[j]
        shifts[j] = shifts[j + 1]
        shifts[j + 1] = temp

      }

      // If same date  compare start time
      else if (shifts[j].date === shifts[j + 1].date) {

        if (shifts[j].startTime > shifts[j + 1].startTime) {

          let temp = shifts[j]
          shifts[j] = shifts[j + 1]
          shifts[j + 1] = temp
        }
      }
    }
  }

  
  for (let shift of shifts) {

    let hour = parseInt(shift.startTime.split(":")[0])

    if (hour < 12) {
      shift.isMorning = true
    } else {
      shift.isMorning = false
    }
  }

  res.render("detail", { employee: employee,shifts:shifts, layout:undefined })

});


/**
 * GET /edit/:id
 * Retrieves employee data and renders the edit page.
 *
 * @async
 * @function
 * @returns {Promise<void>}
 */
app.get("/edit/:id", async(req, res) => {

  let employee = await business.findEmployee(req.params.id)

  if (!employee) {
    return res.send("Employee not found")
  }

  res.render("editEmployee", { employee: employee, layout:undefined })

});


/**
 * POST /edit/:id
 * Validates employee name and phone number,
 * updates the employee record,
 * and redirects to home page.
 *
 * Phone format must be: 0000-0000
 *
 * @async
 * @function
 * @returns {Promise<void>}
 */
app.post("/edit/:id", async(req, res) => {

  let name = req.body.name.trim()
  let phone = req.body.phone.trim()


  if (name === "") {
    return res.send("Name cannot be empty")
  }



  if (phone.length !== 9) {
    return res.send("Phone must be 4 digits-4 digits")
  }

  if (phone[4] !== "-") {
    return res.send("Phone must contain dash in middle")
  }

  // Check first 4 digits
  for (let i = 0; i < 4; i++) {
    if (phone[i] < '0' || phone[i] > '9') {
      return res.send("First 4 must be digits")
    }
  }

  // Check last 4 digits
  for (let i = 5; i < 9; i++) {
    if (phone[i] < '0' || phone[i] > '9') {
      return res.send("Last 4 must be digits")
    }
  }

  // Update using business layer
  await business.updateEmployee(req.params.id, name, phone)

  res.redirect("/")

});

/**
 * Starts the Express server on port 8000.
 *
 * @function
 * @returns {void}
 */
app.listen(8000, () => {
  console.log("Server running on port 8000")
});