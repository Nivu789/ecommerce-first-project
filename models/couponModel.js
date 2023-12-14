const mongoose =  require('mongoose');

const couponSchema = new mongoose.Schema({

    couponcode:{
        type:String,
        required: true 
    },
    status:{
        type:Boolean,
        default:true
    },
    discount:{
        type:Number,
        required:true
    },
    expiryDate:{
        type:Date,
        required:true
    },
    limit:{
        type:Number,
        required:true
    },
    minPurchase:{
        type:Number,
        required:true
    },
    redeemedUsers:[{
        type: mongoose.Schema.Types.ObjectId,

    }],
    description:{
        type:String

    }

});

module.exports = mongoose.model('Coupon',couponSchema);