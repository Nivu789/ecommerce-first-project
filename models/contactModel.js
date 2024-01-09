const mongoose = require('mongoose');

const contact = mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type:String
    },
    phone:{
        type:Number
    },
    subject:{
        type:String
    },
    message:{
        type:String
    },
    time:{
        type:Date
    },
    readByAdmin:{
        type:Boolean
    }
})

const Contact = mongoose.model('contact',contact)

module.exports = Contact