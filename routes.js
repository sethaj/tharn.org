'use strict';

var mongoose  = require('mongoose'),
  nconf       = require( 'nconf' ),
  https       = require( 'https' ),
  url         = require( 'url' ),
  request     = require( 'request' ),
  fs          = require( 'fs' ),
  mkpath      = require( 'mkpath' ),
  mime        = require( 'mime' ),
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
          //console.log(JSON.stringify(pics, null, 4));
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


exports.fetchthumbs = function(req, res) {
  Word.count({}, function(err, count) {
    Word.findOne().limit(-1).skip(Math.floor(Math.random()*count)).exec(function(error, word) {
      if (error) throw error;
      console.log("word id: " + word['_id']);

      var azureUrl = "https://user:"+key+"@api.datamarket.azure.com/Data.ashx/Bing/Search/v1/Image?Query=%27"+word['word']+"%27&$top=20&$format=JSON";
      var httpsreq = https.request(azureUrl, function(response) {

        response.on('data', function(data) {
          var pics = JSON.parse(data);  
          var path = './public/words/'+word['word'];

          mkpath(path, function(err) {
            pics.d.results.forEach(function(result) {
              var parts = url.parse(result.Thumbnail.MediaUrl, true);

              // azure is returning 'image/jpg' not 'image/jpeg'
              mime.define({ 'image/jpg': ['jpg']});
              var file = path + '/' + parts.query.id + '.' + mime.extension(result.Thumbnail.ContentType);

              request(result.Thumbnail.MediaUrl).pipe(fs.createWriteStream(file));

              word.thumbs.push({ file: file });

              word.save(function(error, word) {
                if (error) throw error;
                console.log("saved "+ file + " to " + word.word);
              });
            });
          });

          res.end();
        });
      });
      httpsreq.end();
      httpsreq.on('error', function(e) {
        console.error(e);
      });
    });
  });
};
