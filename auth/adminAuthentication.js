const isLogin = async(req,res,next) =>{
    try {
        if(req.session.activeAdmin){
           console.log("if isLogin",req.session.activeAdmin)
        next();
        }else{
            res.redirect('/admin')
            console.log("else isLogin",req.session.activeAdmin)
        }
    } catch (error) {
        console.log(error)
    }
}

const isLogout = async(req,res,next) =>{
    try {
        if(req.session.activeAdmin){
            console.log("active in logout")
            res.redirect('/admin/dashboard')
        }else{
            // console.log(req.session.activeAdmin)
            console.log("ILogout else")
            next();
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = {isLogin,isLogout}