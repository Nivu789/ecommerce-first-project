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
    flatOfferAmount:{
        type:Number,
        default:0
    },
    offerExpiry:{
        type:Date,
    },
    image:[{
        type:String
    }]
})

const Category = mongoose.model('category',category);

module.exports = Category;