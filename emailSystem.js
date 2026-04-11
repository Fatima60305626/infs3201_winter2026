async function sendEmail(to, code){
    console.log("email")
    console.log("to:", to)
    console.log("subject: OTP")
    console.log("message: your one time pass code for login is ", code)

    
}

async function sendEmailFailedAttempt(to){
    console.log("email")
    console.log("to:", to)
    console.log("subject: Failed Attempt")
    console.log("message: You have reached 3 attempts for OTP, your account will be blocked after 10 attempts")

    
}


module.exports ={
    sendEmail,sendEmailFailedAttempt
}