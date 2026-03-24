const express = require("express")
const handlebars = require("express-handlebars")
const business = require("./bussiness")
const cookieParser = require('cookie-parser')

const app = express()
app.set('views', __dirname + "/templates")

app.engine("handlebars", handlebars.engine())
app.set("view engine", "handlebars")



app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())




/**
 * GET /login
 * Renders the login page with an optional message.
 *
 * @async
 * @function
 * @param {Object} req - Express request object
 * @param {string} [req.query.message] - Optional message to display on login page
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
app.get("/login", async(req, res) => {
  let message = req.query.message
  res.render("login", {message:message, layout:undefined })

});

/**
 * POST /login
 * Authenticates user credentials and creates a session.
 *
 * @async
 * @function
 * @param {Object} req - Express request object
 * @param {Object} req.body - Form data from login request
 * @param {string} req.body.username - Username entered by user
 * @param {string} req.body.password - Password entered by user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
app.post('/login', async (req, res) => {
let username = req.body.username
let password = req.body.password


let result = await business.validateCredentials(username, password)

if (result) {

    let session = await business.startSession({
        username: username
    })

    res.cookie('session', session.uuid, { expires: session.expiry })

    res.redirect('/')
    return
}

// invalid login
res.redirect('/login?message=Invalid%20Credentials')


})
/**
 * Middleware to validate user session.
 * Ensures the user is authenticated before accessing protected routes.
 *
 * @async
 * @function
 * @param {Object} req - Express request object
 * @param {Object} req.cookies - Cookies sent with the request
 * @param {string} req.cookies.session - Session ID stored in cookies
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
async function checkSession(req, res, next) {
    let sessionId = req.cookies.session

    if (!sessionId) {
        res.redirect("/login?message=Please login first")
        return
    }

    let session = await business.getSessionData(sessionId)

    if (!session) {
        res.redirect("/login?message=Invalid session")
        return
    }

    if (session.Expiry < new Date()) {
        res.redirect("/login?message=Session expired")
        return
    }

    // extend session by 5 minutes
    await business.extendSession(sessionId)

    req.username = session.Data.username

    next()
}

/**
 * Middleware to log security related request information.
 * Records user activity such as URL access and HTTP method.
 *
 * @async
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.username - Username extracted from session
 * @param {string} req.originalUrl - Requested URL
 * @param {string} req.method - HTTP method used (GET, POST)
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
async function securityLogger(req, res, next) {
    let log = {
        timestamp: new Date(),
        username: req.username,
        url: req.originalUrl,
        method: req.method
    }

    await business.addSecurityLog(log)

    next()
}


/**
 * GET /
 * Retrieves all employees and renders the home page.
 *
 * @async
 * @function
 * @returns {Promise<void>}
 */
app.get("/", checkSession,securityLogger, async(req, res) => {

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
app.get("/employee/:id", checkSession,securityLogger, async(req, res) => {

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
app.get("/edit/:id",checkSession,securityLogger,  async(req, res) => {

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
app.post("/edit/:id", checkSession,securityLogger, async(req, res) => {

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
 * GET /logout
 * Logs out the authenticated user by deleting their session.
 * Requires a valid session before execution.
 *
 * @async
 * @function
 * @param {Object} req - Express request object
 * @param {Object} req.cookies - Cookies sent with the request
 * @param {string} req.cookies.session - Session ID stored in cookies
 * @param {string} req.username - Username set by checkSession middleware
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
app.get("/logout", checkSession, securityLogger,async (req, res) => {

    let sessionId = req.cookies.session
    await business.deleteSession(sessionId)
    res.clearCookie("session")
    res.redirect("/login?message=Logged%20out")

})


/**
 * Starts the Express server on port 8000.
 *
 * @function
 * @returns {void}
 */
app.listen(8000, () => {
  console.log("Server running on port 8000")
});