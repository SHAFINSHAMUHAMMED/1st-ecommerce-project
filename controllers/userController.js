const User = require('../models/userModel')
const productSchema = require('../models/productModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const session = require('express-session')

const regex_password = /^(?=.*?[A-Z])(?=.*[a-z])(?=.*[0-9]){8,16}/gm
const regex_mobile = /^\d{10}$/

let message,msg

//////////SECURE PASSWORD////////////

const securePassword = async(password)=>{
    try {
      const passwordHash = await  bcrypt.hash(password,10)
      return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

///////////SEND EMAIL VERIFICATION////////

const sendVerifyMail = async (username, email, user_id) => {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'codershafinsha@gmail.com',
          pass: 'djwrpbkkywapftea',
        },
      });
  
      const mailOption = {
        from: 'codershafinsha@gmail.com',
        to: email,
        subject: 'Email verification',
        html: `<p>Hii ${username}, please click <a href="http://127.0.0.1:3000/verify?id=${user_id}">here</a> to verify your email.</p>`,
      };
  
      transporter.sendMail(mailOption,(error, info) => {
        if (error) {
          console.log(error.message);
          console.log('Email could not be sent');
        } else {
          console.log('Email has been sent:',info.response);
        }
      });
    } catch (error) {
      console.log(error);
      console.log('Error occurred while sending email');
    }
  };

/////////USER SUIGNUP//////////

const userSignup = async(req,res)=>{
    try {
        res.render('signup',{message,msg})
        message=null
        msg=null
    } catch (error) {
        console.log(error.message);
    }
}


///////INSERT USERDATA//////////

const insertUser = async(req,res)=>{
    const usd=req.body
    let user
    const checkMail = await User.findOne({email:usd.email})
    const checkMob = await User.findOne({phone:usd.phone})
    console.log(checkMail);
    
    try {
        if(!usd.email&&!usd.phone&&!usd.password&&!usd.username){
            res.redirect('/signup')
            msg='Please fill all the forms'
        }else if(!usd.username||usd.username.trim().length<3){
            res.redirect('/signup')
            msg='Enter valid name'
        }else if(!usd.email||usd.username.trim().length==0){
            res.redirect('/signup')
            msg='Enter email'
        }else if(checkMail){
            res.redirect('/signup')
            msg='Email already exist'
        }else if(!usd.phone){
            res.redirect('/signup')
            msg='Enter mobile number'
        }else if(regex_mobile.test(usd.phone)==false){
            res.redirect('/signup')
            msg='Enter valid mobile no'
        } else if(checkMob){
            res.redirect('/signup')
            msg='Phone number already exist'
        }else if(!usd.password){
            res.redirect('/signup')
            msg='Enter password'
        }else if(regex_password.test(usd.password)==false){
            res.redirect('/signup')
            msg='Use strong password'
        } else if(usd.password!=usd.Rpassword){
            res.redirect('/signup')
            msg="Password not match"
        }
        else{
            const paswwordSec = await securePassword(usd.password)
            user = new User({
            username:usd.username,
            email:usd.email,
            phone:usd.phone,
            password:paswwordSec,
            is_admin:0
           })
        }
        
        const userData = await user.save()
        console.log(userData);

        if(userData){
             sendVerifyMail(usd.username,usd.email,userData._id)   
             res.redirect('/login')
             message='Registration successfull.Please verify your Email'
        }else{
         res.redirect('/signup')
         msg='registration failed'
        }

    } catch (error) {
        console.log(error.message);
    }
}

////////LOGIN USER///////

const loginUser = async(req,res)=>{

    try {
        res.render('login',{message,msg})
        message=null
        msg=null
    } catch (error) {
        console.log(error.message);
    }
}

//////////LOGIN VERIFICATION///////////

const verifyLogin = async(req,res)=>{
    try {
        if(req.body.email.trim().length==0||req.body.password.trim().length==0){
            res.redirect('/login')
            msg='Please fill all the forms'
        }else{
            const email = req.body.email
            const password = req.body.password
            const userData = await User.findOne({email:email})
            console.log(userData);
    
            if(userData){
                const passwordHash = await bcrypt.compare(password,userData.password)
                console.log(passwordHash);
                if(passwordHash){
                    if(userData.is_verified==1){
                        if(userData.is_blocked==0){
                            req.session.user_id = userData._id;
                            console.log(req.session.user_id );
                            res.redirect('/')
                        }else{
                            res.redirect('/login')
                            msg='Your account has been blocked'
                        }
                    }else{
                        res.redirect('/login')
                        msg='Mail is not verified'
                    }
                }else{
                    res.redirect('/login')
                    msg='password is incorrect'
                }
            }else{
                res.redirect('/login')
                msg='user not found'
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}

///////LOADING HOME PAGE////////

const loadHome = async(req,res)=>{
    try{
        let session = req.session.user_id
        
        const products = await productSchema.find()
        res.render('home',{product:products,session})
    }catch(err){
        console.log('okkkkkkkk');
        console.log(err);
    }
}

///////////LOGOUT////////////

const logOut = async(req,res)=>{
    req.session.user_id = null
    res.redirect('/login')
}

///////////ADMIN BLOCKED/////////////

const logOutIn = async(req,res)=>{
    req.session.user_id = null
    res.redirect('/admin/userData')
}

/////////EMAIL VERIFICATION////////////

const verifyMail = async(req,res)=>{
    try {
       const updateInfo = await User.updateOne({_id:req.query.id},{$set:{is_verified:1}})
       console.log(updateInfo);
       res.render('email_verified')
    } catch (error) {
        console.log(error.message);
    }
}


////////OTP LOGIN///////

const otpLogin = async(req,res)=>{
    try {
        res.render('otp-login',{message,msg})
        message=null
        msg=null
    } catch (error) {
        console.log(error.message);
    }
}

////////OTP PAGE///////

const otppage = async(req,res)=>{
    try {
        res.render('otp-page',{message,msg})
        message=null
        msg=null
    } catch (error) {
        console.log(error.message);
    }
}

//////////OTP GENERATION///////////

function otpgen(){
    OTP=Math.random()*1000000
    OTP=Math.floor(OTP)
    return OTP
}
let otp

//////////OTP email VERIFICATION///////////

let otpChechMail
const verifyotpMail = async(req,res)=>{
    try {
        if(req.body.email.trim().length==0){
            res.redirect('/otp-login')
            msg='Please fill the form'
        }else{
            otpChechMail = req.body.email
            const userData = await User.findOne({email:otpChechMail})
            console.log(userData);
    
            if(userData)
            {
                if(otpChechMail){
                    if(userData.is_verified==1){
                        if(userData.is_blocked==0){
                            res.redirect('/otp-page')
                            const mailtransport = nodemailer.createTransport({
                                host: 'smtp.gmail.com',
                                port: 465,
                                secure: true,
                                auth: {
                                  user: 'codershafinsha@gmail.com',
                                  pass: 'djwrpbkkywapftea',
                                },
                              });

                            otp=otpgen()
                            let details={
                                from:"codershafinsha@gmail.com",
                                to:otpChechMail,
                                subject:"Classy Fashion Club",
                                text: otp+" is your Classy Fashion Club verification code. Do not share OTP with anyone "
                            }
                            mailtransport.sendMail(details,(err)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                    console.log("success");
                                }
                            })
                            
                        }else{
                            res.redirect('/otp-login')
                            msg='Your account has been blocked'
                        }
                    }else{
                        res.redirect('/otp-login')
                        msg='Mail is not verified'
                    }
                }
            }else{
                res.redirect('/otp-login')
                msg='user not found'
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}

///////LOAD OTP PAGE////////

const otpVerify = async(req,res)=>{
    try {
        if(req.body.otp.trim().length==0){
            res.redirect('/otp-page')
            msg='Please Enter OTP'
        }else{
            const OTP = req.body.otp
            if(otp==OTP){
                const userData = await User.findOne({email:otpChechMail})  
                req.session.user_id = userData._id;
                console.log(req.session.user_id );
                res.redirect('/')
            }else{
                    res.redirect('/otp-page')
                    msg='OTP is incorrect'
                }
    } 
    }catch (error) {
        console.log(error.message);   
    }
}
module.exports = {
    userSignup,
    insertUser,
    verifyMail,
    loginUser,
    verifyLogin,
    loadHome,
    logOut,
    logOutIn,
    otpLogin,
    verifyotpMail,
    otppage,
    otpVerify
}