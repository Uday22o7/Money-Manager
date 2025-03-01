const express = require("express");
const path = require('path')
const ejsMate = require("ejs-mate")
const bodyParser = require("body-parser")
const app = express();
const port = 8000;

app.set('view engine', 'ejs')
app.engine('ejs', ejsMate)
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


app.get("/",(req,res)=>{
    res.send("Hello")
});

app.listen(port, (req, res) => {
    console.log(`Server is live on port 8000.  http://localhost:${port}`)
});