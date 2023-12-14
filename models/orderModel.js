const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"customer",
        required:true
    },
    products:[{
        productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"product",
        required:true
    },
    quantity:{
        type:Number,
        required:true
    }

    }],
    addressIndex:{
        type:Number,
        default:0,
        required:true
    },
    orderDate:{
        type:Date,
        default:Date.now
    },
    totalAmount:{
        type:String,
        required:true
    },
    orderStatus:{
        type:String,
        enum:['Order Placed','Shipped','Delivered','Cancelled','Returned'],
        default:'Order Placed'
    },
    paymentStatus:{
        type:String,
        enum:['Pending','Success','Failed'],
        default:'Pending'
    },
    paymentMethod:{
        type:String,
        required:true
    }

})

const Order = mongoose.model('orders',orderSchema);

module.exports = Order