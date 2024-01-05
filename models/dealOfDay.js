const mongoose = require('mongoose');

const deal = mongoose.Schema({
    index:{
        type:Number
    },
    caption:{
        type:String
    },
    regularPrice:{
        type:Number
    },
    salePrice:{
        type:Number
    },
    expiryDate:{
        type:Date
    },
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'product'
    },
    active:{
        type:Boolean,
        default:false
    },
    image:{
        type:String
    }
})

const DealOfDay = mongoose.model('dealOfDay',deal)

module.exports = DealOfDay