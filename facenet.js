var express = require('express')
var app = express()

var { Facenet } = require('facenet')

var multer = require('multer')
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public')
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname)
  }
})

const f = new Facenet()

async function main() {
  await f.init()
  console.log('Facenet initialized')
}

main().then(function() {
  var upload = multer({storage: storage})
  
  app.use(express.static('public'))
  
  async function compare(sourceImage, targetImage) {
    try {
      const sourceList = await f.align(sourceImage)
      console.log('sourceList:', sourceList)


      const targetList = await f.align(targetImage)
      console.log('targetList:', targetList)

      if (sourceList.length == 0 || targetList.length == 0) return 1

      const sourceFace = sourceList[0]
      const targetFace = targetList[0]
    
      sourceFace.embedding = await f.embedding(sourceFace)
      targetFace.embedding = await f.embedding(targetFace)
    
      return sourceFace.distance(targetFace)  
    } catch (e) {
      console.log('The error:', e)
      throw e
    }
  }
  
  app.post('/upload', upload.array('photos', 2), function(req, res, next) {
    var sourceFile = req.files[0]
    var targetFile = req.files[1]
  
    compare(sourceFile.path, targetFile.path).then((result) => {
      var html =
      "<div style='float:left'>" +
      "  <img src='" + sourceFile.originalname + "' style='max-width: 250px;'>" +
      "</div>" +
      "<div style='float:left; padding: 150px 125px'>" +
      "  <h1> " + (result > 0.75 ? "!=" : "=") + " </h1>" +
      "</div>" +
      "<div style='float:left'>" +
      "  <img src='" + targetFile.originalname + "' style='max-width: 250px;'>" +
      "</div>" +
      "<div style='clear: both;'></div>"
      res.send(html)
      res.end()
    })
  })
  
  app.listen(3333, function () {
    console.log('Listening on port 3333!');
  })
})