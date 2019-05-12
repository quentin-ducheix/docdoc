const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const request = require('request');
const fs = require('fs');

const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())

//global name of the current name of the image upload
let tempo_name;

//set storage engine for multer
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, cb) {
    tempo_name = Date.now() + path.extname(file.originalname);
    cb(null, tempo_name);
  }
});

//init upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb)
  }
}).single('myImage');

//function to check file type
function checkFileType(file, cb){
  //extension
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  //check mime
  const mimetype = filetypes.test(file.mimetype)
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

app.post('/subscribe', (req, res) => {
  if(
    req.body.captcha === undefined ||
    req.body.captcha === '' ||
    req.body.captcha === null
  ){
    return res.json({"success": false, "msg":"Please select captcha"});
  }
  // Secret Key
  const secretKey = '6LdpvDEUAAAAAHszsgB_nnal29BIKDsxwAqEbZzU';
  // Verify URL
  const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;
  // Make Request To VerifyURL
  request(verifyUrl, (err, response, body) => {
    body = JSON.parse(body);
    console.log(body);
    // If Not Successful
    if(body.success !== undefined && !body.success){
      return res.json({"success": false, "msg":"Failed captcha verification"});
    }
    return res.json({"success": true, "msg":"captcha verified"});
  });
});

app.post('/contact', function (req, res) {
  let mailOpts, smtpTrans;
  smtpTrans = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: "register.epi@gmail.com",
      pass: "Rob2n30420"
    }
  });
  mailOpts = {
    from: req.body.name + ' &lt;' + req.body.email + '&gt;',
    to: "register.epi@gmail.com",
    subject: 'New message from contact form at docodoceyes',
    text: `${req.body.name} (${req.body.email}) says: ${req.body.message}`
  };
  smtpTrans.sendMail(mailOpts, function (error, response) {
    if (error) {
      res.render('submited');
    }
    else {
      res.render('submited');
    }
  });
});

// Passport Config
require('./config/passport')(passport);

// var db = require('mongodb').MongoClient;

// MongoClient.connect("/exampleDb", function(err, db) {
  // if(!err) {
    // console.log("We are connected");
  // }
// });

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/docdoceyes",
  { useNewUrlParser: true },
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//public folder
app.use(express.static('./public'));

app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if(err){
      res.render('skin', {
        msg: err
      })
    } else {
      if (req.file == undefined) {
        res.render('skin', {
          msg: 'Error: No file selected!'
        })
      } else {
        var url = 'http://localhost:5000/predict';
        var data = {
          image: fs.createReadStream('./public/uploads/' + tempo_name)
        };
        request.post({url:url, formData: data}, function(err, httpResponse, body) {
          if (err) {
            res.render('skin', {
              msg: 'Error while processiong your image!'
            });
          }
          res.render('skin', {
            msg: body
          });
        });
      }
    }
  })
});

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));
app.use(express.static('./views'))
app.use('/assets', express.static('./assets'))

const PORT = process.env.PORT || 8081;
//changed from 5000 to 8081

app.listen(PORT, console.log(`Server started on port ${PORT}`));

//errors page
// 404
app.use(function(req, res, next) {
  return res.render('error');//res.status(404).send({ message: 'Route'+req.url+' Not found.' });
});

// 500 - Any server error
app.use(function(err, req, res, next) {
  return res.render('error');
});