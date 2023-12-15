const mongoose = require('mongoose');

const category = mongoose.Schema({
    categoryName:{
        type:String
    },
    description:{
        type:String
    },
    is_active:{
        type:Boolean
    },
    discountPercentage:{
        type:Number,
        default:0
    },
    offerExpiry:{
        type:Date,
    }
})

const Category = mongoose.model('category',category);

module.exports = Category;