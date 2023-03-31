const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  orders: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'orders'
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products'
  }],
  totalSales: {
    type: Number,
    required: true
  },
  totalItemsSold: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('SalesReport', salesSchema);