'use strict';

var mongoose  = require('mongoose'),
  nconf       = require( 'nconf' ),
  https       = require( 'https' ),
  http        = require( 'http' ),
  url         = require( 'url' ),
  request     = require( 'request' ),
  fs          = require( 'fs' ),
  mkpath      = require( 'mkpath' ),
  mime        = require( 'mime' ),
  pairtree    = require( 'pairtree' ),
  path        = require( 'path' ),
  Word        = mongoose.model('words');

nconf.use('file', { file: './config.json' });
var key = nconf.get('azure:key');

exports.index = function(req, res) {
  Word.count({}, function(err, count) {
    Word.findOne().limit(-1).skip(Math.floor(Math.random()*count)).exec(function(err, word) {
      //console.log("word: " + word['word']);
      var azureUrl = "https://user:"+key+"@api.datamarket.azure.com/Data.ashx/Bing/Search/v1/Image?Query=%27"+word['word']+"%27&$top=20&$format=JSON";
      var httpsreq = https.request(azureUrl, function(response) {
        response.on('data', function(data) {
          var pics = JSON.parse(data);
          console.log(JSON.stringify(pics, null, 4));
          res.render('index.jade', { pics: pics, word: word['word'] });
        });
      });
      httpsreq.end();
      httpsreq.on('error', function(e) {
        console.error(e);
      });
    });
  });
};


exports.fetchone = function(req, res) {
  Word.count({}, function(err, count) {
    Word.findOne().limit(-1).skip(Math.floor(Math.random()*count)).exec(function(error, word) {
      if (error) throw error;
      console.log('word id: ObjectId("' + word._id +'") word: ' + word.word);

      var azureUrl = "https://user:"+key+"@api.datamarket.azure.com/Data.ashx/Bing/Search/v1/Image?Query=%27"+word.word+"%27&$top=20&$format=JSON";
      var httpsreq = https.request(azureUrl, function(response) {

        var data = '';
        response.on('data', function(chunk) {
          data += chunk;
        });
        response.on('end', function() {
          var pics      = JSON.parse(data);  
          var wd_path   = __dirname + '/public/words' + pairtree.path(word.word) + word.word;
          var th_path   = wd_path + '/thumbs/';
          var img_path  = wd_path + '/images/';
          // azure is returning 'image/jpg' not 'image/jpeg', register it
          mime.define({ 'image/jpg': ['jpg']});

          mkpath(wd_path, function(err) {
            fs.writeFile(wd_path + "/" + word.word + ".json", JSON.stringify(pics, null, 4), function(err) {
              if (err) console.log(err);
            });
            mkpath(th_path, function(e) {
              var count = 0;
              pics.d.results.forEach(function(result) {
                count++;
                var parts = url.parse(result.Thumbnail.MediaUrl, true);
                var id = parts.query.id;
                var file = th_path + id + '.' + mime.extension(result.Thumbnail.ContentType);
                
                request(result.Thumbnail.MediaUrl).pipe(fs.createWriteStream(file));
                word.thumbs.push({ file: file });
                word.save();
              
                mkpath(img_path, function(e3) {
                  var img_url = url.parse(result.MediaUrl);
                  file = img_path + id + '--' + path.basename(img_url.pathname); 
                  request(result.MediaUrl).pipe(fs.createWriteStream(file));
                  word.images.push({ file: file });
                  word.save();
                });
              });
            });
          });
        });
      });
      httpsreq.end();
      httpsreq.on('error', function(e) {
        console.error(e);
      });
    });
  });
  res.end();
};
