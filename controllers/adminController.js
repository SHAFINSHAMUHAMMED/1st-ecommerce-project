const userSchema = require("../models/userModel");
const categorySchema = require("../models/categoryModel");
const productSchema = require("../models/productModel");
const orderSchema = require("../models/orderModel");
const couponSchema = require("../models/couponModel");
const salesSchema = require("../models/salesReport");
const sharp = require("sharp");
const swal = require("sweetalert2");
const bcrypt = require("bcrypt");
const { CURSOR_FLAGS } = require("mongodb");

let msg;
let message;
let messag;

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
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 10;
    const users = await userSchema.find();
    const usersLength = users.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 7
    );
    const yearAgo = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate()
    );

    const dailySalesReport = await salesSchema.aggregate([
      { $match: { date: { $gte: today } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalSales" },
          totalItemsSold: { $sum: "$totalItemsSold" },
        },
      },
    ]);

    const weeklySalesReport = await salesSchema.aggregate([
      { $match: { date: { $gte: weekAgo } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalSales" },
          totalItemsSold: { $sum: "$totalItemsSold" },
        },
      },
    ]);

    const yearlySalesReport = await salesSchema.aggregate([
      { $match: { date: { $gte: yearAgo } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalSales" },
          totalItemsSold: { $sum: "$totalItemsSold" },
        },
      },
    ]);
    const orders = await orderSchema
      .find()
      .populate("userId")
      .populate("item.product")
      .sort({ date: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    const count = await orderSchema.find().countDocuments();
    res.render("home", {
      dailySalesReport,
      weeklySalesReport,
      yearlySalesReport,
      orders,
      message,
      usersLength,
      totalPages: Math.ceil(count / limit),
      page,
    }),
      (message = null);
  } catch (error) {
    console.log(error);
  }
};

////sales report////

const printDailySalesReport = (dailySalesReport) => {
  if (dailySalesReport.length > 0) {
    const date = new Date(dailySalesReport[0]._id);
    const formattedDate = `${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()}`;
    const totalSales = dailySalesReport[0].totalSales;
    const report = `Daily Sales Report (${formattedDate}): ₹${totalSales}`;
    console.log(report);
    return report;
  } else {
    console.log("No daily sales report found.");
    return "";
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
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 4;

    const userData = await userSchema
      .find({
        is_admin: 0,
        $or: [
          { username: { $regex: ".*" + search + ".*", $options: "i" } },
          { email: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await userSchema
      .find({
        is_admin: 0,
        $or: [
          { username: { $regex: ".*" + search + ".*", $options: "i" } },
          { email: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      })
      .countDocuments();

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
    res.render("userData", {
      users: userData,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
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
    const user = await userSchema.updateOne(
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
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 4;
    const products = await productSchema
      .find({
        $or: [
          { title: { $regex: ".*" + search + ".*", $options: "i" } },
          { brand: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      })
      .populate("category")
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    const count = await productSchema
      .find({
        $or: [
          { title: { $regex: ".*" + search + ".*", $options: "i" } },
          { brand: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      })
      .countDocuments();
    res.render("products", {
      product: products,
      message,
      msg,
      totalPages: Math.ceil(count / limit),
    });
    message = "";
    msg = "";
  } catch (error) {
    console.log(error);
  }
};

///////////DELETE PRODUCT//////////////////

const deleteProduct = async (req, res) => {
  try {
    const id = req.body.delete;
    console.log(id);
    await productSchema.deleteOne({ _id: new Object(id) });
    message = "Product Deleted";
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};

///////////Unlist PRODUCT//////////////////

const unlistProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await productSchema.updateOne(
      { _id: new Object(id) },
      { $set: { unlisted: 1 } }
    );
    message = "Product Unlisted";
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};

///////////List PRODUCT//////////////////

const listProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await productSchema.updateOne(
      { _id: new Object(id) },
      { $set: { unlisted: 0 } }
    );
    message = "Product Listed";
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};
///////////////////LOAD EDIT PRODUCT PAGE//////////////////

const loadEditPage = async (req, res) => {
  try {
    const id = req.query.id;
    const products = await productSchema
      .find({ _id: new Object(id) })
      .populate("category");
    console.log(products);
    const category = await categorySchema.find();
    res.render("editProduct", { product: products, category: category, msg });
    msg = null;
  } catch (error) {
    console.log(error);
  }
};

///////////////ADD PRODUCT//////////////////
let mess;
const newProduct = async (req, res) => {
  try {
    const category = await categorySchema.find();
    res.render("addProduct", { category: category, message, msg, mess });
    message = null;
    msg = null;
    mess = null;
  } catch (error) {
    console.log(error);
  }
};

///////////ADD PRODUCT///////////

const addProduct = async (req, res) => {
  try {
    const pro = req.body;
    const category = await categorySchema.findOne({
      category: req.body.category,
    });
    if (
      pro.title.trim().length == 0 ||
      pro.brand.trim().length == 0 ||
      pro.description.trim().length == 0 ||
      pro.price.toString().trim().length == 0 ||
      pro.price <= 0 ||
      pro.stock.toString().trim().length == 0 ||
      pro.stock <= 0 ||
      !req.files ||
      req.files.length == 0 ||
      req.files.some((file) => file.mimetype.split("/")[0] !== "image") ||
      pro.size.length == 0 ||
      pro.color.length == 0
    ) {
      message = "Enter Valid Data";
      res.redirect("/admin/addProduct");
    } else {
      let image = req.files.map((file) => file);
      for (i = 0; i < 4; i++) {
        console.log(image);
        let path = image[i].path;
        console.log(image[i].filename);
        console.log(path);
        sharp(path)
          .rotate()
          .resize(270, 360)
          .toFile("public/proImage/" + image[i].filename);
      }

      const product = new productSchema({
        categoryid: category._id,
        title: pro.title,
        brand: pro.brand,
        stock: pro.stock,
        price: pro.price,
        description: pro.description,
        category: pro.category,
        image: req.files.map((file) => file.filename),
        size: pro.size,
        color: pro.color,
      });
      await product.save();
      mess = "Product Added";
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

    if (
      prod.title.trim().length == 0 ||
      prod.price.trim().length == 0 ||
      prod.stock.trim().length == 0 ||
      prod.brand.trim().length == 0 ||
      prod.description.trim().length == 0 ||
      !req.files ||
      req.files.length == 0 ||
      req.files.some((file) => file.mimetype.split("/")[0] !== "image")
    ) {
      msg = "Product Not Edited! Please Fill All Field";
      res.redirect("/admin/products");
    } else {
      let newprod;
      if (req.file) {
        newprod = await productSchema.updateOne(
          { _id: new Object(id) },
          {
            $set: {
              title: prod.title,
              brand: prod.brand,
              description: prod.description,
              category: prod.category,
              stock: prod.stock,
              price: prod.price,
              image: req.files.map((file) => file.filename),
            },
          }
        );
      } else {
        newprod = await productSchema.updateOne(
          { _id: new Object(id) },
          {
            $set: {
              title: prod.title,
              brand: prod.brand,
              description: prod.description,
              category: prod.category,
              stock: prod.stock,
              price: prod.price,
              image: req.files.map((file) => file.filename),
            },
          }
        );
      }
      message = "Product Edited Successfully";
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
  }
};

////////////ADD CATEGORY///////////////

const addCategory = async (req, res) => {
  const newCat = req.body.newcategory;
  const category = categorySchema({
    category: newCat,
  });
  const checkCat = await categorySchema.findOne({ category: newCat });
  if (newCat.trim().length === 0) {
    res.redirect("/admin/category");
    msg = "Please Fill";
  } else {
    if (checkCat) {
      res.redirect("/admin/category");
      msg = "Already Exist";
    } else {
      const cat = await category.save();
      message = "Category Added";
      res.redirect("/admin/Category");
    }
  }
};

////////////EDIT CATEGORY///////////

const editCategory = async (req, res) => {
  try {
    const oldCat = req.body.category;
    const newCat = req.body.editedCategory;
    const checkNew = await categorySchema.findOne({ category: newCat });
    if (newCat.trim().length === 0) {
      res.redirect("/admin/category");
      msg = "Please fill submited area";
    } else {
      if (checkNew) {
        res.redirect("/admin/category");
        msg = "Already Exist";
      } else {
        await categorySchema.updateOne(
          { category: oldCat },
          { category: newCat }
        );
        message = "Category Updated Successfully";
        res.redirect("/admin/Category");
      }
    }
  } catch (error) {
    console.log(error);
  }
};

////////////CATEGORY MANAGE///////////////////

const categoryManage = async (req, res) => {
  try {
    const category = await categorySchema.find();
    res.render("categoryManage", { category: category, msg, message });
    msg = null;
    message = null;
  } catch (error) {
    console.log(error);
  }
};

////////////////////DELETE CATEGORY////////////

const categoryDelete = async (req, res) => {
  try {
    const delCat = req.body.category;
    const category = await categorySchema.findOne({
      category: new Object(delCat),
    });
    const product = await productSchema.findOne({ categoryid: category._id });
    if (product) {
      msg = "Category used in product";
      res.redirect("/admin/Category");
    } else {
      await categorySchema.deleteOne({ category: delCat });
      res.redirect("/admin/Category");
      message = "Category deleted successfully";
    }
  } catch (error) {
    console.log(error);
  }
};

////////////CANCEL ORDER/////////

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.query.orderid;

    await orderSchema.updateOne(
      { _id: orderId },
      { $set: { admin_cancelled: true } }
    );
    const order = await orderSchema.findOne({ _id: orderId });
    if (order.paymentType === "online") {
      let grandTotal = order.grandTotal;
      const userId = order.userId;
      const user = await userSchema.findOne({ _id: userId });
      const wallet = parseFloat(user.wallet) || 0;
      // Add the totalPrice to the user's wallet
      await userSchema.updateOne(
        { _id: userId },
        { $set: { wallet: wallet + grandTotal } }
      );
    }
    res.redirect("/admin/home");
    if (order.paymentType === "online") {
      messag = "Orderd canelled And Refunded";
    } else {
      messag = "Orderd canelled";
    }
  } catch (error) {
    console.log(error.message);
  }
};

////////ORDER Accept///////////

const acceptOrder = async (req, res) => {
  try {
    const orderId = req.query.orderid;
    await orderSchema.updateOne(
      { _id: orderId },
      { $set: { is_confirmed: true } }
    );
    const order = await orderSchema.findOne({ _id: orderId });
    ///stock decrementing///
    for (const item of order.item) {
      const productId = item.product._id;
      const qty = item.quantity;
      const product = await productSchema.findOne({ _id: productId });

      product.stock -= qty;
      await product.save();
    }

    res.redirect("/admin/home");
    messag = "Return Rejected";
  } catch (error) {
    console.log(error.message);
  }
};

///Confirm Delivery/////

const acceptDelivery = async (req, res) => {
  try {
    const orderId = req.query.orderid;
    const order = await orderSchema.findOne({ _id: orderId });
    if (order.is_delivered === false) {
      await orderSchema.updateOne(
        { _id: orderId },
        {
          $set: {
            is_delivered: true,
            delivered_date: new Date().toLocaleDateString(),
          },
        }
      );

      const updatedOrder = await orderSchema.findOne({ _id: orderId });
      if (
        updatedOrder.is_delivered === true &&
        (updatedOrder.admin_reject === 1 || updatedOrder.admin_reject === 0)
      ) {
        let product = [];
        let totalprice = 0;
        updatedOrder.item.forEach((item) => {
          product.push(item.product);
          totalprice += item.price * item.quantity;
        });
        const newSalesReport = new salesSchema({
          date: new Date(),
          orders: updatedOrder._id,
          products: product,
          totalSales: totalprice,
          totalItemsSold: product.length,
        });
        await newSalesReport.save();
      }
      res.redirect("/admin/home");
      message = "Orderd status changed successfully";
    }
  } catch (error) {
    console.log(error.message);
  }
};

////Return rejected////

const rejectReturn = async (req, res) => {
  try {
    const orderId = req.query.orderid;
    await orderSchema.updateOne(
      { _id: orderId },
      { $set: { admin_reject: 1 } }
    );
    res.redirect("/admin/home");
    messag = "Return Rejected";
  } catch (error) {
    console.log(error.message);
  }
};

//////Accepting Return/////

const acceptReturn = async (req, res) => {
  try {
    const orderId = req.query.orderid;
    const order = await orderSchema.findOne({ _id: orderId });
    ///updating stock/////
    for (let item of order.item) {
      const product = await productSchema.findOne({ _id: item.product });
      const newStockQuantity = product.stock + item.quantity;
      await productSchema.updateOne(
        { _id: item.product },
        { $set: { stock: newStockQuantity } }
      );
    }
    await orderSchema.updateOne(
      { _id: orderId },
      { $set: { admin_reject: 2 } }
    );
    //delete from sales report
    await salesSchema.deleteOne({
      orders: orderId,
    });

    let grandTotal = order.grandTotal;
    console.log(typeof grandTotal);
    const userId = order.userId;
    const userr = new userSchema({});
    const user = await userSchema.findOne({ _id: userId });
    const wallet = parseFloat(user.wallet) || 0;
    // Add the totalPrice to the user's wallet
    await userSchema.updateOne(
      { _id: userId },
      { $set: { wallet: wallet + grandTotal } }
    );

    res.redirect("/admin/home");
    messag = "Return accepted";
  } catch (error) {
    console.log(error.message);
  }
};

/////view order////

const viewOrder = async (req, res) => {
  try {
    const orderId = req.query.orderid;
    const orders = await orderSchema
      .findOne({ _id: orderId })
      .populate("item.product");

    res.render("viewOrder", { orders });
  } catch (error) {
    console.log(error.message);
  }
};

//////Coupon////////

const CouponGenerate = async (req, res) => {
  try {
    const coupon = await couponSchema.find();
    if (coupon) {
      res.render("coupon", { message, coupon, msg });
      message = null;
    } else {
      res.render("coupon", { message, msg });
      message = null;
    }
  } catch (error) {
    console.log(error);
  }
};

const addCoupon = async (req, res) => {
  try {
    let couponData = req.body;
    const coupon = couponSchema({
      couponId: couponData.couponId,
      expiryDate: couponData.expiryDate,
      minItems: parseInt(couponData.items),
      minAmount: parseInt(couponData.minAmount),
      maxAmt: parseInt(couponData.maxAmount),
      discount: parseInt(couponData.discount),
    });
    const check = await couponSchema.findOne({ coupon: couponData.couponId });
    if (
      couponData.couponId.trim().length === 0 ||
      couponData.expiryDate.toString().trim().length === 0 ||
      couponData.items.toString().trim().length === 0 ||
      couponData.minAmount.toString().trim().length === 0 ||
      couponData.maxAmount.toString().trim().length === 0 ||
      couponData.discount.toString().trim() === 0
    ) {
      message = "please fill all fields";
      res.redirect("/admin/Coupons");
    } else {
      if (check) {
        message = "Coupon Already Exist";
        res.redirect("/admin/Coupons");
      } else {
        const coup = await coupon.save();
        msg = "coupon added";
        res.redirect("/admin/Coupons");
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const deleteCoupon = async (req, res) => {
  try {
    let couponId = req.query.id;
    console.log(couponId);
    await couponSchema.deleteOne({ _id: couponId });
    message = "Coupon Deleted";
    res.redirect("/admin/Coupons");
  } catch (error) {
    console.log(error);
  }
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
  categoryManage,
  editCategory,
  categoryDelete,
  cancelOrder,
  acceptOrder,
  acceptDelivery,
  rejectReturn,
  acceptReturn,
  CouponGenerate,
  addCoupon,
  deleteCoupon,
  printDailySalesReport,
  unlistProduct,
  listProduct,
  viewOrder,
};
