var express = require('express')
var app = express()
var fs = require('fs')

var config = require('./config.js')
var aws = require('aws-sdk')
aws.config.region = config.region
var rekognition = new aws.Rekognition({region: config.region});


var multer = require('multer')
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public')
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname)
  }
})
var upload = multer({storage: storage})

app.use(express.static('public'))

app.post('/upload', upload.array('photos', 2), function(req, res, next) {

  var sourceFile = req.files[0]

  console.log(sourceFile)

  var targetFile = req.files[1]

  console.log(targetFile)

  if (sourceFile.size > 1000 * 1000 || targetFile > 1000 * 1000) {
    var html = "<p>The files uploaded are larger than 1MB</p>" +
    "<br>" +
    "<a href='/'>Back</a>"
     
    res.send(html)
    res.end()
  }

  var sourceData = fs.readFileSync(sourceFile.path)
  var targetData = fs.readFileSync(targetFile.path)

  var params = {
    SourceImage: {
      Bytes: sourceData
    },
    TargetImage: {
      Bytes: targetData
    }
  }

  rekognition.compareFaces(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      let result = false

      if (data.FaceMatches.length == 1) {
        result = data.FaceMatches[0].Similarity > 50
      }

      var html =
      "<div style='float:left'>" +
      "  <img src='" + sourceFile.originalname + "' style='max-width: 250px;'>" +
      "</div>" +
      "<div style='float:left; padding: 150px 125px'>" +
      "  <h1> " + (result ? "=" : "!=") + " </h1>" +
      "</div>" +
      "<div style='float:left'>" +
      "  <img src='" + targetFile.originalname + "' style='max-width: 250px;'>" +
      "</div>" +
      "<div style='clear: both;'></div>"

      res.send(html)
    }    
  })
})

app.listen(5555, function () {
	console.log('Listening on port 5555!');
})