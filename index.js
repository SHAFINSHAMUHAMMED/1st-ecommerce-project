const mongoose = require('mongoose')
const morgan = require('morgan')
const userRout = require('./router/userRout')
const adminRout = require('./router/adminRout')
const bodyParser = require('body-parser')
const session = require('express-session')
const nocache = require('nocache')
const path = require('path')
// const cookieParser = require('cookie-parser')

mongoose.set('strictQuery', false)
mongoose.connect('mongodb://127.0.0.1:27017/MaleFashion')

const express = require('express')
const app = express()
app.use(morgan("dev"));
app.use(nocache())

// app.use(cookieParser())
app.use(session({ secret: 'secretkey', cookie: { maxAge: 60000 * 10 }, saveUninitialized: true, resave: true }))
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/', userRout)
app.use('/admin', adminRout)

app.listen(3000, () => {
    console.log('server running');
})
