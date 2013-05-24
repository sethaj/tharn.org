var mongoose = require('mongoose'),
  nconf = require( 'nconf' );

var Schema = mongoose.Schema;

var thumbSchema = new Schema({
  file: String,
});
var imageSchema = new Schema({
  file: String,
});

var wordSchema = new Schema({
  word: String,
  syllable: Number,
  type: String,
  thumbs: [thumbSchema],
  images: [imageSchema],
  fetched_date: { type: Date, default: Date.now }
});
mongoose.model('words', wordSchema);

nconf.use('file', { file: './config.json' });
var user      = nconf.get('mongo:username');
var pass      = nconf.get('mongo:password');
var database  = nconf.get('mongo:database');
var host      = nconf.get('mongo:hostname');
var dsn = 'mongodb://' + user + ':' + pass + '@' + host + '/' + database;
mongoose.connect(dsn, function(err) {
  if (err) throw err;
});
