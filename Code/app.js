const express = require("express");
const path = require('path')
const ejsMate = require("ejs-mate")
const mongoose = require("mongoose");
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const app = express();
const port = 8000;
const mongoURI = process.env.MONGO_URI;
const db = "mongodb://127.0.0.1:27017/Money_Manager"

dotenv.config()

mongoose.connect(db)
    .then(() => {
        console.log('mongo Connection is successful');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });



app.set('view engine', 'ejs')
app.engine('ejs', ejsMate)
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


app.get("/",(req,res)=>{
    res.render("./landingPage.ejs")
});

app.get("/auth",(req,res)=>{
    res.render("./authPage.ejs")
});



app.listen(port, (req, res) => {
    console.log(`Server is live on port 8000.  http://localhost:${port}`)
});