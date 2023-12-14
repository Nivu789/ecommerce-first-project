const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Number
    },
    is_active:{
        type:Boolean
    },
    otp:{
        type:Number
    },
    is_verified:{
        type:Boolean
    },
    address:[{
        firstname:{
            type:String
        },
        lastname:{
            type:String
        },
        a1:{
            type:String
        },
        a2:{
            type:String
        },
        city:{
            type:String
        },
        state:{
            type:String
        },
        postcode:{
            type:Number
        },
        phone:{
            type:Number
        },
        email:{
            type:String
        }

    }],
    cart:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'product'
            },
            quantity:{
                type:Number
            }
        }
    ],
    wallet:{
        type:Number,
        default:0
    },
    ref_code:{
        type:String
    }
})


const User = mongoose.model('customer',userSchema);

module.exports = User;