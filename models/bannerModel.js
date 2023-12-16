const mongoose = require('mongoose');

const banner = mongoose.Schema({
    bannerName:{
        type:String
    },
    image:[
        {
            type:String
        }
    ],
    bannerText:{
        type:String
    }
})

const Banner = mongoose.model('banner',banner)

module.exports = Banner