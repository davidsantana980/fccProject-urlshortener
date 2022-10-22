"use strict"

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT;
const validator = require('validator');
const mongoose = require('mongoose');
const shortid = require('shortid');

//configurations

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.urlencoded({extended: false}));
app.use('/public', express.static(`${process.cwd()}/public`));

//mongo functions 

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true}, console.log("success in connecting to mongodb"));

let linkSchema = new mongoose.Schema({
  link: {
      type: String, required: true
  },
  shortenedLink: {
      type: String, default: shortid.generate
  }
});

let shortener = mongoose.model("shortener", linkSchema);

//functions

let isInDB = async (url) => {
  return await shortener.exists({link : url}, (err, data) => {
    err ? console.log(err) : data;
  });
}

// let findShortenedLink = async (word) => {
//   await shortener.find({link : word}, (err, data) => {
//     err ? console.log(err) : console.log(data.shortenedLink);
//   })
// }

//requests

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async (req, res) => {
  try{
    let message = {"error": "Invalid URL"};
    let formURL = req.body.url;

    if(!validator.isURL(formURL)) {
      return res.send(message);
    }

    await shortener.create({link : formURL});

    return await shortener.findOne({link : formURL}, (err, data) => {
      err ? console.log(err) :  res.send({original_url: data.link, short_url: data.shortenedLink});
    }).clone();
  }catch(error){
    console.log(error);
  }
});

app.get('/api/shorturl/:shorturl?', async (req, res) => {
  try{
    let decodedURL = await shortener.findOne({shortenedLink : req.params.shorturl}, (err, data) => {
      err ? console.log(err) :  data.link;
    }).clone();
    res.redirect(decodedURL.link);
  }catch(error){
    console.log(error);
  }
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
