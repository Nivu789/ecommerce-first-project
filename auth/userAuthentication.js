const isLogin = async(req,res,next) =>{
    try {
        if(req.session.activeUser){
        
        next(); 
        }else{
            res.redirect('/')
        }
    } catch (error) {
        console.log(error)
    }
    
}

const isLogout = async(req,res,next) =>{
    try {
        if(req.session.activeUser){
            
            res.redirect('/')
        }else{

            next();
        }
    } catch (error) {
        console.log(error)
    }
    
}

module.exports = {isLogin,isLogout}