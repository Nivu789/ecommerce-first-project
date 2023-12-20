const mongoose = require('mongoose');

const brand = mongoose.Schema({
    brandName:{
        type:String
    },
    description:{
        type:String
    },
    is_active:{
        type:Boolean
    },
    image:[
        {
            type:String
        }
    ]
})

const Brand = mongoose.model('brand',brand);

module.exports = Brand;