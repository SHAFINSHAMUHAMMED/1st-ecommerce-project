const userSchema = require("../models/userModel");
const categorySchema = require("../models/categoryModel");
const productSchema = require("../models/productModel");
const session = require("express-session");
const bcrypt = require("bcrypt");

let msg;
let message;

////////LOGIN PAGE LODING////////////

const loginLoad = async (req, res) => {
  res.render("login", { msg });
  msg = null;
};

/////////////ADMIN LOGIN////////////////////

const adminLogin = async (req, res) => {
  try {
    const adminMail = req.body.email;
    const pass = req.body.password;
    const adminData = await userSchema.findOne({ email: adminMail });
    console.log("hallodgf");

    if (adminMail.trim().length == 0 || pass.trim().length == 0) {
      res.redirect("/admin");
      msg = "Please fill all the forms";
    } else {
      if (adminData) {
        const comparePassword = await bcrypt.compare(pass, adminData.password);
        if (comparePassword) {
          if (adminData.is_admin == 1) {
            req.session.admin_id = adminData._id;
            res.redirect("/admin/home");
          } else {
            res.redirect("/admin");
            msg = "You are not an admin";
          }
          // req.session.admin = adminMail
          // console.log(req.session.admin);
          // res.redirect('/admin/home')
        } else {
          res.redirect("/admin");
          msg = "Incorrect password";
        }
      } else {
        res.redirect("/admin");
        msg = "Incorrect email";
      }
    }
  } catch (error) {
    console.log(error);
  }
};

///////////LOADIN HOME PAGE/////////////

const loadAdminHome = async (req, res) => {
  try {
    const userData = await userSchema.find({ is_admin: 0 });
    console.log(userData);
    res.render("home", { userData });
  } catch (error) {
    console.log(error);
  }
};

/////////////LOGOUT/////////////////

const adminLogOut = async (req, res) => {
  try {
    req.session.admin_id = null;
    res.redirect("/admin");
  } catch (error) {
    console.log(error);
  }
};

///////////LOAD USERDATA/////////////

const loadUserData = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const userData = await userSchema.find({
      is_admin: 0,
      $or: [
        { username: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    });
    for (i = 0; i < userData.length; i++) {
      if (userData[i].is_verified == 0) {
        userData[i].Status = "not verified";
      } else if (userData[i].is_blocked == 0) {
        userData[i].Status = "Active";
      } else {
        userData[i].Status = "Blocked";
      }
    }
    console.log(userData);
    res.render("userData", { users: userData });
  } catch (error) {
    console.log(error);
  }
};

/////////////BLOCK USER///////////////

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await userSchema.updateOne(
      { _id: new Object(id) },
      { $set: { is_blocked: 1 } }
    );
    res.redirect("/logoutIn");
  } catch (error) {
    console.log(error);
  }
};

//////////UNBLOCK USER////////////

const unblockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await userSchema.updateOne(
      { _id: new Object(id) },
      { $set: { is_blocked: 0 } }
    );
    res.redirect("/admin/userData");
  } catch (error) {
    console.log(error);
  }
};

///////////////SHOW PRODUCTS///////////////////

const loadProducts = async (req, res) => {
  try {
    const products = await productSchema.find();
    console.log(products);
    res.render("products", { product: products });
  } catch (error) {
    console.log(error);
  }
};

///////////DELETE PRODUCT//////////////////

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await productSchema.deleteOne({ _id: new Object(id) });
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};
///////////////////LOAD EDIT PRODUCT PAGE//////////////////

const loadEditPage = async (req, res) => {
  try {
    const id = req.query.id;
    const products = await productSchema.find({ _id: new Object(id) });
    console.log(products);
    const category = await categorySchema.find();
    res.render("editProduct", { product: products, category: category });
  } catch (error) {
    console.log(error);
  }
};

///////////////ADD new PRODUCT//////////////////

const newProduct = async (req, res) => {
  try {
    const category = await categorySchema.find();
    console.log(category);
    res.render("addProduct", { category: category, message });
    message = null;
  } catch (error) {
    console.log(error);
  }
};

///////////ADD PRODUCT///////////

const addProduct = async (req, res) => {
  try {
    const pro = req.body;

    if (
      pro.title.trim().length == 0 ||
      pro.brand.trim().length == 0 ||
      pro.description.trim().length == 0 ||
      !req.file
    ) {
      message = "All Fields Are Mandatory";
      res.redirect("/admin/addProduct");
    } else {
      const product = new productSchema({
        title: pro.title,
        brand: pro.brand,
        stocks: pro.stocks,
        price: pro.price,
        description: pro.description,
        category: pro.category,
        image: req.file.filename,
      });

      const proSave = await product.save();
      console.log(proSave);
      res.redirect("/admin/addProduct");
    }
  } catch (error) {
    console.log(error);
  }
};

////////EDIT PRODUCTS/////////////

const editProduct = async (req, res) => {
  try {
    const prod = req.body;
    const id = req.query.id;
    console.log(req.file);
    //    let image=req.file.filename
    const newprod = await productSchema.updateOne(
      { _id: new Object(id) },
      {
        $set: {
          title: prod.title,
          brand: prod.brand,
          description: prod.description,
          category: prod.category,
          stocks: prod.stocks,
          price: prod.price,
          image: [req.file.filename],
        },
      }
    );
    console.log(newprod);
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};

////////////ADD CATEGORY///////////////

const addCategory = async (req, res) => {
  const category = categorySchema({
    category: req.body.newcategory,
  });
  const cat = await category.save();
  console.log(cat);
  res.redirect("/admin/addProduct");
};

module.exports = {
  loginLoad,
  adminLogin,
  loadAdminHome,
  adminLogOut,
  loadUserData,
  blockUser,
  unblockUser,
  newProduct,
  addCategory,
  addProduct,
  loadProducts,
  deleteProduct,
  loadEditPage,
  editProduct,
};
