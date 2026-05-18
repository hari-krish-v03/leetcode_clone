const express = require("express");
const app = express();

const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const {exec} = require("child_process");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const {problemListModel,userListModel,codeStoreModel} = require("./db");
const jwt = require("jsonwebtoken");

const {auth} = require("./middlewares/auth");

require("dotenv").config();
mongoose.connect(process.env.MongoUrl);

const port = 3000;
const JWT_Secret = process.env.jwtSecret;

app.use(express.json());
// app.use(cors());


app.get("/",(req,res)=>{
    res.sendFile(__dirname + "/public/auth.html");
})


app.get("/new",(req,res)=>{
    res.sendFile(__dirname + "/public/signup.html");
})

//landing page of the application
app.get('/in',(req,res)=>{
    res.sendFile(__dirname + "/public/index.html");
})

//this responds with the lsit of problems in the database
app.get('/problems',auth,async (req,res)=>{
    // console.log(req.email);
    const problemList = await problemListModel.find();
    res.send(problemList);
})

//below method to fetch the problem data from db
app.get('/getProblem/:num',auth,async (req,res)=>{
    const num = req.params.num;
    const probData = await problemListModel.findOne({
        num : num
    });
    // console.log(probData)
    res.send(probData);
})

//to run code locally
app.post('/run',auth,async (req,res)=>{
    // console.log("reached");
    const code = req.body.code;
    const language = req.body.language;

    let fileName = "";
    let runCommand = "";
    if(language==="javascript"){
        fileName = "Main.js";
        runCommand = "node "+fileName;
    }
    else if(language === "java"){
        fileName = "Main.java";
        runCommand = "javac "+fileName+" && java "+fileName;
    }

    const filePath = __dirname + "/code/"+fileName;
    fs.writeFileSync(filePath, code, 'utf-8');

    exec(runCommand,{cwd: __dirname + "/code", timeout: 5000},
        (error, stdout, stderr)=>{

            if(fs.existsSync(filePath)){
                fs.unlinkSync(filePath);
                if(language==="java"){
                    fs.unlinkSync(__dirname + "/code/Main.class");
                }
            }
            if(error){
                console.log("My error: "+ stderr);
                return res.json({
                    success: false,
                    output: stderr
                })
            }

            console.log(stdout);
            res.json({
                success: true,
                output: stdout
            })
        }
    )
    })

//search functionality
app.post('/search',auth,async(req,res)=>{
    const probNum = req.body.searchText;
    const prob = await problemListModel.findOne({
        num:probNum
    });
    res.send(prob);
})

//signup
app.post('/signup',async (req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    const encryptedPWD = await bcrypt.hash(password,5);

    await userListModel.create({
        email: email,
        password: encryptedPWD,
        name: name
    })
    res.send("signed up successfully");
})

//signin
app.post('/signin',async (req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const response = await userListModel.findOne({
        email:email,
    })
    console.log(response.password);
    const correctPWD = await bcrypt.compare(password,response.password);
    if(correctPWD){
        console.log("Sign in success");
        const token = jwt.sign({
           email: response.email
        },JWT_Secret);

        res.json({token:token});
    }
    else{
        console.log("Incorrect Creds");
        res.status(403).json({
            message: "Incorrect credentials"
        })
    }
});

//saves code to db
app.post("/codeSaver",auth,async (req,res)=>{
    const email = req.creds.email;
    const probNum = req.body.num.split("/").pop();
    const code = req.body.code;
    const language = req.body.language;
    await codeStoreModel.findOneAndUpdate({
        email:email,
        problemNum:probNum,
        language: language
        },
        {
            code : code
        },
        {
            upsert:true,
            returnDocument: 'after'
        }
    )
    res.send("Code Saved");
})

//fetched updated code from db
app.post("/savedCode/:num",auth,async(req,res)=>{
    const num = (req.params.num).toString();
    const email = req.creds.email;
    const language = req.body.language;
    const foundCode = await codeStoreModel.findOne({
        email:email,
        problemNum:num,
        language:language
    })
    if(foundCode){
        res.send(foundCode);    
    }
    else{
        res.send("NOTFOUND");
    }
    
})



//this takes to the page where we can solve the problem
app.get('/:id',(req,res)=>{

    res.sendFile(__dirname+"/public/problem.html")
})


app.listen(port);