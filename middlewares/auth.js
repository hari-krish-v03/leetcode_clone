const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_Secret = process.env.jwtSecret;

function auth(req,res,next){
    const token = req.headers.token;
    // console.log(token + " in middleware");
    if(token==undefined){
        res.sendFile(path.join(__dirname,"/public/auth.html"));
        // res.sendFile(__dirname+"/public/auth.html")
        return;
    }
    // console.log(token);
    const decodedEmail = jwt.verify(token,JWT_Secret);
    // console.log(decodedEmail);
    req.creds = decodedEmail;
    next();
}

module.exports = {auth};