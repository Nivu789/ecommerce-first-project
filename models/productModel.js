const mongoose = require('mongoose');

const products = mongoose.Schema({
    productName:{
        type:String,
        
    },
    brand:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'brand'
    },
    description:{
        type:String,
    },
    categoryid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'category'
    },
    regularPrice:{
        type:Number
    },
    salePrice:{
        type:Number
    },
    quantity:{
        type:Number,
        default:1
    },
    image:[{
        type:String
    }],
    is_active:{
        type:Boolean
    },
    discountPercentage:{
        type:Number,
        default:0
    },
    productReview:[
        {
            comment:{
                type:String,
            },
            userId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'customer'
            },
            rating:{
                type:Number
            },
            time:{
                type:Date,
                
            },
            replies:[
                {
                    comment:{
                        type:String
                    },
                    userId:{
                        type:mongoose.Schema.Types.ObjectId
                    },
                    time:{
                        type:Date
                    }
                }
                
            ]
        }

    ],
    avgRating:{
        type:Number,
        default:0
    },
    dealOfDay:{
        type:Boolean,
        default:false
    }
})

const Product = mongoose.model('product',products);

module.exports = Product