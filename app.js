'use strict';

var application_root = __dirname,
  express   = require( 'express' ),
  app       = express(),
  path      = require( 'path' ),
  db        = require( './db' ),
  mongoose  = require( 'mongoose' ),
  Word      = mongoose.model('words');


app.configure( function() {
  app.use( express.bodyParser() );
  app.use( express.methodOverride() );
  app.use( app.router );
  app.use( express.static( path.join( application_root, 'public') ) );
  app.use( express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.set( 'views', __dirname + '/views');
});

var routes = require( './routes.js' );
app.get('/', routes.index );
app.get('/fetchone', routes.fetchone );


var port = 8089;
app.listen( port, function() {
    console.log( 'Express server listening on port %d in %s mode', port, app.settings.env );
});
