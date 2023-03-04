const express = require("express")
const multer = require('multer')
const path = require('path')
const storage = multer.diskStorage({
    destination:(req,file,callback)=>{
    callback(null,path.join(__dirname,'../public/proImage'))
    },
    filename:(req,file,callback)=>{
        const name = Date.now()+'-'+file.originalname;
        callback(null,name)
    }
});

const upload = multer({storage:storage})
const admin_rout = express()

const adminController = require('../controllers/adminController')
const auth = require('../middleware/authAdmin')

admin_rout.set('view engine', 'ejs')
admin_rout.set('views', './views/admin')

admin_rout.get('/', auth.adminLogin, adminController.loginLoad)

admin_rout.post('/',adminController.adminLogin)

admin_rout.get('/home', auth.logOutSession, adminController.loadAdminHome)

admin_rout.get('/logout', auth.logOutSession, adminController.adminLogOut)

admin_rout.get('/userData', auth.logOutSession, adminController.loadUserData)

admin_rout.get('/blockUser', auth.logOutSession, adminController.blockUser)

admin_rout.get('/unblockUser', auth.logOutSession, adminController.unblockUser)

admin_rout.get('/addProduct', auth.logOutSession, adminController.newProduct)

admin_rout.post('/addProduct',upload.single('image'),adminController.addProduct)

admin_rout.post('/addCategory',adminController.addCategory)

admin_rout.get('/products',auth.logOutSession,adminController.loadProducts)

admin_rout.get('/deleteProduct',auth.logOutSession,adminController.deleteProduct)

admin_rout.get("/editProduct",auth.logOutSession,adminController.loadEditPage)

admin_rout.post('/editProduct',upload.single('image'),adminController.editProduct)

// admin_rout.get('/category',auth.logOutSession,adminController.categoryManage)

module.exports = admin_rout