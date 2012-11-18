console.log(".---------------------------.");
console.log("| * Starting Node service * |");
console.log("'---------------------------'");


//colors for console logging
/*
  FGRED=`echo "\033[31m"`
  FGCYAN=`echo "\033[36m"`
  BGRED=`echo "\033[41m"`
  FGBLUE=`echo "\033[35m"`
  BGGREEN="\033[42m"
*/
blue  = '\033[36m';
reset = '\033[0m';

logBlue = function(str){console.log(blue + str + reset)};

/**
 * Moduledependencies.
 */
var express = require("express")
  , util    = require("util")
  , spawn   = require('child_process').spawn
  , exec    = require('child_process').exec
  , _       = require('underscore')
  , path    = require('path')
  , http    = require('http')
  ;

/**
 * Global declarations
 */
STATIC_PROVIDER = express.static(__dirname + '/public');
EDITABLE_APPS_DIR = "workspace/";
ENABLE_LAUNCH     = false;
TEAM_ID = "team";

// Our app configuration
app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.set('address', '0.0.0.0');
  app.set('views', __dirname + '/view');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
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


    if(req.session && req.session.user){
      res.cookie('_username', req.session.user.username);
    }

    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
    next();
  });

  app.use(app.router);
  app.use(STATIC_PROVIDER);
});

// Configuring express to show better error messages
app.configure('development', function(){
  app.use(express.errorHandler());
});

// Launching server
server = http.createServer(app).listen(app.get('port'), app.get('address'), function(){
  console.log('   ' + blue + "Express server listening on port " + reset + app.get('port'));
});

// Configuring IO
var io = require('socket.io').listen(server);
io.configure(function () {
    io.set("transports", [ "htmlfile", "xhr-polling", "jsonp-polling", "flashsocket" ]);
});

/**
 * Global modules
 */
crypto  = require('crypto');
walk    = require('walk');
nowjs   = require('now');
fs      = require('fs');
moment  = require('moment');
uglJs   = require("uglify-js2");

var Util       = require('./controller/util')
  , FileGroup  = require('./controller/fileGroup')
  , FileSystem = require('./controller/file')
  , User       = require('./controller/user')
  , Auth       = require('./controller/auth')
  , Project    = require('./controller/project')
  , Docs       = require('./controller/docs')
  ;

/**
 * Importing controllers
 */
  utl    = new Util()
, fg     = new FileGroup()
, myFs   = new FileSystem()
, user   = new User()
, auth   = new Auth()
, project= new Project()
, docs   = new Docs()
;

var routes = require('./routes');

// Added for keeping this file "as untouchable as possible"
routes.route();
