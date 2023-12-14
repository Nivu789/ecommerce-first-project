const mongoose = require('mongoose')

const wishlist = mongoose.Schema({
    userId:{
        type:mongoose.Types.ObjectId,
        required:true
    },
    products:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'product'
            },
            quantity:{
                type:Number
            }
        }
    ]
})

const Wishlist = mongoose.model('wishlist',wishlist)

module.exports = Wishlist