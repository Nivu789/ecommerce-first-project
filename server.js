const express = require('express');
const app = express();
const path = require('path')

const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://nivuyt789:nivedneha@ecommerce.z6wlh5z.mongodb.net/Companion")
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')
app.use(express.urlencoded({extended:true}))
app.use(express.json());
const nocache = require("nocache");
const errorHandler = require('./functions/errorHandler')

app.use(nocache());

app.use(express.static('public'))
app.use("/uploads",express.static('uploads'))
app.set('view engine','ejs')
// app.set('views','./views')


app.use('/',userRoute);
app.use('/admin',adminRoute)

app.use('*',(req,res)=>{
    res.render('user/404page')
})

app.use(errorHandler);

app.listen(3000,()=>{
    console.log("Server is running")
})