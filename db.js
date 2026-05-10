const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const problemList = new Schema({
    num: Number,
    problem : String,
    description : String
})

const userList = new Schema({
    email: {type: String, unique: true},
    password: String,
    name : String
})

const codeStore = new Schema({
    email: String,
    problemNum : String,
    language : String,
    code : String

})

const problemListModel = mongoose.model("Problems",problemList);
const userListModel = mongoose.model("users",userList);
const codeStoreModel = mongoose.model("code",codeStore);

module.exports = {problemListModel,userListModel,codeStoreModel};