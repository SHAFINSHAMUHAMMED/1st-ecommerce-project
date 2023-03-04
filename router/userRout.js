const express = require('express')
const user_route = express()

const userController = require('../controllers/userController')
const auth = require('../middleware/auth')
// const multer = require('multer')

// const storage = multer.diskStorage({

// })

user_route.set('view engine','ejs')
user_route.set('views','./views/users')

user_route.get('/signup',auth.loginSession,userController.userSignup)

user_route.post('/signup',userController.insertUser)

user_route.get('/login',auth.loginSession,userController.loginUser)

user_route.get('/verify',userController.verifyMail)

user_route.post('/login',userController.verifyLogin)

user_route.get('/',userController.loadHome)

user_route.get('/logout',auth.logOutSession,userController.logOut)

user_route.get('/logoutIn',userController.logOutIn)

user_route.get('/otp-login',auth.loginSession,userController.otpLogin)

user_route.get('/otpVerifyMail',auth.loginSession,userController.verifyotpMail)

user_route.post('/otpVerifyMail',userController.verifyotpMail)

user_route.get('/otp-page',auth.loginSession,userController.otppage)

user_route.get('/otpSubmit',auth.loginSession,userController.otpVerify)

user_route.post('/otpSubmit',userController.otpVerify)

module.exports = user_route