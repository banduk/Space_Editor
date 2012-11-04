
/**
 * Module dependencies.
 */

console.log(".---------------------------.");
console.log("| * Starting Node service * |");
console.log("'---------------------------'");


//MODULES
var express = require("express"),
    util    = require("util"),
    fs      = require('fs'),
    crypto  = require('crypto'),
    walk    = require('walk'),
    spawn   = require('child_process').spawn,
    exec    = require('child_process').exec,
    _       = require('underscore'),
    http    = require('http'),
    path    = require('path');

//GLOBALS!
staticProvider = express.static(__dirname + '/public');
EDITABLE_APPS_DIR = "workspace/";
ENABLE_LAUNCH     = false;
thisAppDirName = __dirname.substring(__dirname.lastIndexOf("/")+1);
teamID = "team";


// Declaring app as global
app  = express();

var server = http.createServer(app),
    io     = require('socket.io').listen(server);

io.configure(function () {
    io.set("transports", [ "htmlfile", "xhr-polling", "jsonp-polling", "flashsocket" ]);
});

app.configure(function(){
  app.set('port', process.env.PORT || 3149);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');

  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.cookieParser('thisSpaceEditorCookieParserSecret'));
  app.use(express.session({
    secret: "thisSpaceEditorSessionSecret",
    store:  new express.session.MemoryStore(),
    cookie: {
      path     : '/',
      httpOnly : true,
      maxAge   : 1000*60*60*24*30*2    //60 days
    }
  }));

  app.use(function(req, res, next){
    var err = req.session.error
      , msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
    next();
  });

  app.use(app.router);
  app.use(staticProvider);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// Getting routes
require('./routes');

console.log(".----------------------------------.");
console.log("| *. Space running on port "+ app.get('port') +" .* |");
console.log("'----------------------------------'");

