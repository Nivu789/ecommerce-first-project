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
    walletTransaction:[
        {
            Amount:{
                type:Number,
                default:0
            },
            transactionType:{
                type:String
            },
            time:{
                type:Date
            }
        }

    ],
    ref_code:{
        type:String
    },
    accountCreated:{
        type:Date,
        default:Date.now
    }
})


const User = mongoose.model('customer',userSchema);

module.exports = User;