const mongoose = require('mongoose')
const messageScema= mongoose.Schema({
    message:{
        type:Array,
        required:true
    }
})

module.exports = mongoose.model('message',messageScema)