
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

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.set('address', '0.0.0.0');
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

var uCount = (new Date()).getTime()%99999;
app.use(function(req, res, next){
  if(req.session && req.session.user){
    res.cookie('_username', req.session.user.name);
  }
  next();
});


app.configure('development', function(){
  app.use(express.errorHandler());
});

server = http.createServer(app).listen(app.get('port'), app.get('address'), function(){
  console.log("Express server listening on " + app.get('address') + ":" + app.get('port'));
});
var io     = require('socket.io').listen(server);

io.configure(function () {
    io.set("transports", [ "htmlfile", "xhr-polling", "jsonp-polling", "flashsocket" ]);
});

// Getting routes
require('./routes');



nowjs     = require("now");
everyone  = nowjs.initialize(server, {socketio: {"transports": [ "htmlfile", "xhr-polling", "jsonp-polling", "flashsocket" ]}});


var fg      = require('./controllers/fileGroup'),
    myFs    = require('./controllers/file.js')/*,
    chatter = require('./controllers/chat.js')*/;

// ------ REALTIME NOWJS COLLABORATION ------
//var nowcollab = require("../CHAOS/nowcollab");
//nowcollab.initialize(nowjs, everyone, true);
//-------------------------------------------
nowjs.on('connect', function () {
  //console.log("CONNECT    > " + this.user.clientId);
  this.user.teamID      = teamID;
  if(this.now.teamID !== ''){
    this.user.teamID = this.now.teamID;
  }
  //console.log(this.user);
  //console.log(everyone.users);
  //console.log(" >> PROJECT="+this.user.teamID);
  // hack to get out best guess at the user (since now.js doesn't give us the request object or session!);
  var u = {}; //(Auth || {}).getUserFromCache(decodeURIComponent(this.user.cookie['_chaos.auth'])) || {};
  // now populate it..
  this.user.about       = {};
  this.user.about._id   = u._id || 0;
  this.user.about.name  = u.nameGiven || u.name  || this.user.cookie["_username"] || "???";
  this.user.about.email = u.emailPrimary || "anon@user.org";
  // -----
  this.now.name = this.user.about.name;
  // -----
  this.user.grouplist   = []; // file groups starts out empty.
  fg.addUserToFileGroup(this.user, ""); // the blank file group is the the team group.

var output = "this.now = [\n";
var object = this.now;
for (property in object) {
  output += '  ' + property + ': ' + object[property]+';\n';
}
output+="]"
console.log(output);

  this.now.c_confirmProject(this.user.teamID);
});

nowjs.on('disconnect', function () {
  //console.log("DISCONNECT > "+this.user.clientId+" >> "+this.user.about.name+" <"+this.user.about.email+">");
  //console.log("DISCONNECT > "+this.user.clientId+" >> "+this.now.name);
  var teamgroup  = nowjs.getGroup(this.user.teamID);
  // remove user from all file groups.
  if(this.user.grouplist !== undefined){
    for(var i=this.user.grouplist.length-1; i>=0; i--){
      var g = this.user.grouplist[i];
      var fname = g.substring(g.indexOf("/")+1);
      fg.usersInGroupMinusMinus(g);
      teamgroup.now.c_processUserFileEvent(fname, "leaveFile", this.user.clientId, myFs.usersInGroup[g]);
    }
  }
  // finally, remove the user from the team group. (don't need this now since team is also in user.grouplist)
//  teamgroup.now.c_processUserEvent("leave", this.user.clientId, this.now.name);
});

//---------
// NOW: Remote collab messages.
everyone.now.s_sendCursorUpdate = function(fname, range, changedByUser){
  var userObj = this.user;
  var filegroup = nowjs.getGroup(userObj.teamID+"/"+fname);

  var _usersIngroup = "";
  var users = filegroup.users;
  for (userInUsers in users) {
    _usersIngroup += '        [ ' + userInUsers+ ': ' + users[userInUsers].user.about.name +' ]\n';
  }

  console.log("SENDING CURSOR!!!!!\n"+
              "    usr  : " + this.user.about.name + "\n" +
              "    group: {\n" + _usersIngroup + "    }\n" +
              " cielntId: "+this.user.clientId + "  now.name:" + this.now.name + "  changedByUser: " + changedByUser);

  filegroup.now.c_updateCollabCursor(this.user.clientId, this.now.name, range, changedByUser);
};
everyone.now.s_sendDiffPatchesToCollaborators = function(fname, patches, crc32){
  var userObj = this.user;
  myFs.localFileIsMostRecent[userObj.teamID+"/"+fname] = false; // mark file as changed.
  var filegroup = nowjs.getGroup(userObj.teamID+"/"+fname);
  filegroup.now.c_updateWithDiffPatches(this.user.clientId, patches, crc32);
};


// NOW: Remote file tools.

//Get the contents of a File
/*everyone.now.s_getLatestFileContentsAndJoinFileGroup = function(fname, fileRequesterCallback){
  var callerID = this.user.clientId;
  var userObj = this.user;

  // Adds user to the list of editors of this file
  fg.addUserToFileGroup(userObj, fname);

  // If the server file is most recent fetch it
  if(myFs.localFileIsMostRecent[userObj.teamID+"/"+fname] === true || myFs.localFileIsMostRecent[userObj.teamID+"/"+fname] === undefined){
    //console.log("FILE FETCH: " + userObj.teamID + " >> " + fname + ", by user: " + (userObj.about.name || callerID));
    myFs.localFileFetch(userObj, fname, fileRequesterCallback);
    //this.now.c_addFileToChat(fname);
  }else{
    //console.log("FILE FETCH (passed to user): " + userObj.teamID + " >> " + fname + ", by user: " + callerID);

    // Get the group of users that is editting this file
    var filegroup = nowjs.getGroup(userObj.teamID+"/"+fname);
    // For each user that is editing
    var users = filegroup.getUsers(function (users) {
      var foundUser = false;

      // Try to find the user that requested the file
      for (var i = 0; i < users.length; i++){

        // If found
        if(users[i] != callerID){
          // this looks like a valid user to get the file from. :)
          console.log("Trying to get file from: " + users[i]);

          // for the found user
          nowjs.getClient(users[i], function(){
            // If the clientId is undefined just fetch the server file
            if(this.now === undefined){
              console.log("Undefined clientId for requestFullFileFromUserID (using local) >> " + users[i]);
              myFs.localFileFetch(userObj, fname, fileRequesterCallback);
            }else{
              // let the user with his file, it will be saved later
              this.now.c_userRequestedFullFile(fname, callerID, fileRequesterCallback);
              //this.now.c_addFileToChat(fname);
            }
          });
          foundUser = true;
          break;
        }
      }

      // If did not found a user to get the file from, just fetch the server file
      if(!foundUser){
        console.log("Flagged as changed, but no user with file: "+userObj.teamID+" >> "+fname+" >> FETCHING last saved.");
        myFs.localFileFetch(userObj, fname, fileRequesterCallback);
      }
    });
  }
};*/
everyone.now.s_getLatestFileContentsAndJoinFileGroup = function(fname, fileRequesterCallback){
  var callerID = this.user.clientId;
  var userObj = this.user;
  fg.addUserToFileGroup(userObj, fname);
  //removeUserFromAllFileGroupsAndAddToThis(origUser, fname);
  if(myFs.localFileIsMostRecent[userObj.teamID+"/"+fname] === true || myFs.localFileIsMostRecent[userObj.teamID+"/"+fname] === undefined){
    myFs.localFileFetch(userObj, fname, fileRequesterCallback);
    //console.log("FILE FETCH: " + userObj.teamID + " >> " + fname + ", by user: " + (userObj.about.name || callerID));
  }else{
    console.log("FILE FETCH (passed to user): " + userObj.teamID + " >> " + fname + ", by user: " + callerID);
    var filegroup = nowjs.getGroup(userObj.teamID+"/"+fname);
    var users = filegroup.getUsers(function (users) {
      var foundUser = false;
      for (var i = 0; i < users.length; i++){
        if(users[i] != callerID){
          // this looks like a valid user to get the file from. :)
          console.log("Trying to get file from: " + users[i]);
          nowjs.getClient(users[i], function(){
            if(this.now === undefined){
              console.log("Undefined clientId for requestFullFileFromUserID (using local) >> " + users[i]);
              myFs.localFileFetch(userObj, fname, fileRequesterCallback);
            }else{
              this.now.c_userRequestedFullFile(fname, callerID, fileRequesterCallback);
            }
          });
          foundUser = true;
          break;
        }
      }
      if(!foundUser){
        console.log("Flagged as changed, but no user with file: "+userObj.teamID+" >> "+fname+" >> FETCHING last saved.");
        myFs.localFileFetch(userObj, fname, fileRequesterCallback);
      }
    });
  }
};
everyone.now.s_saveUserFileContentsToServer = function(fname, fcontents, fileSaverCallback){
  myFs.localFileSave(this.user, fname, fcontents, fileSaverCallback);
};
//-------
// get rid of this is possible...
everyone.now.s_requestFullFileFromUserID = function(fname, id, fileRequesterCallback){
  var callerID = this.user.clientId;
  var userObj = this.user;
  var filegroup = nowjs.getGroup(userObj.teamID+"/"+fname);
  filegroup.hasClient(id, function (bool) {
    if (bool) {
      //console.log("requesting full file. valid filegroup. :)");
      nowjs.getClient(id, function(){
        if(this.now === undefined){
          console.log("Undefined clientId for requestFullFileFromUserID >> " + id);
        }else{
          this.now.c_userRequestedFullFile(fname, callerID, fileRequesterCallback);
        }
      });
    }
  });
};
//-------


/*everyone.now.s_sendFileChat = function(fname, message){
  var filegroup    = nowjs.getGroup(this.user.teamID+"/"+fname);
  var fromUserId   = this.user.clientId;
  var fromUserName = this.now.name;
  filegroup.now.c_receiveFileChat(fname, message, fromUserId, fromUserName);
};*/

everyone.now.s_teamMessageBroadcast      = function(type, message){
  var teamgroup  = nowjs.getGroup(this.user.teamID);
  var scope      = "team";
  var fromUserId = this.user.clientId;
  var fromUserName = this.now.name;
  teamgroup.now.c_processMessage(scope, type, message, fromUserId, fromUserName);
};
everyone.now.s_leaveFile                 = function(fname){
  var teamgroup  = nowjs.getGroup(this.user.teamID);
  var fromUserId = this.user.clientId;
  fg.removeUserFromFileGroup(this.user, fname);
};
everyone.now.s_sendUserEvent             = function(event){
  var teamgroup  = nowjs.getGroup(this.user.teamID);
  var fromUserId = this.user.clientId;
  var fromUserName = this.now.name;
  teamgroup.now.c_processUserEvent(event, fromUserId, fromUserName);
};
//-------
everyone.now.s_getAllProjectsFiles = function(callback){
  var team = this.user.teamID;
  var projectRoot = EDITABLE_APPS_DIR+team;
  var walker = walk.walk(projectRoot, {followLinks: false});
  var filesAndInfo = [];
  walker.on("names", function (root, nodeNamesArray) {
    // use this to remove/sort files before doing the more expensive "stat" operation.
    //console.log(root + " / " + nodeNamesArray);
    for(var i=nodeNamesArray.length-1; i>=0; i--){
      if(nodeNamesArray[i] == ".git" || nodeNamesArray[i] == "node_modules" || nodeNamesArray[i] == "_db"){
        nodeNamesArray.splice(i, 1);
      }
    }
  });
  walker.on("file", function (root, fileStats, next) {
    var rt = root.substring(projectRoot.length+1);
    if(rt.length > 0){
      rt += "/";
    }
    var fname = rt + fileStats.name;
    var sz = fileSizeCache[team+"/"+fname];
    if(sz === undefined){
      // first time checking files size.. get it!
      sz = fileStats.size;
      fileSizeCache[team+"/"+fname] = sz;
    }
    var n = myFs.usersInGroup[team+"/"+fname];
    if(n){
      filesAndInfo.push([fname, n, sz]);
    }else{
      filesAndInfo.push([fname, 0, sz]);
    }
    next();
  });
  walker.on("end", function() {
    console.log("Recursively listed project files for: " + team);
    // indicate total team members online.
    var n = myFs.usersInGroup[team];
    if(n){
      filesAndInfo.push(["", n]);
    }else{
      filesAndInfo.push(["", 0]);
    }
    callback(null, filesAndInfo);
  });
};
everyone.now.s_createNewFile = function(newFilename, fileCreatorCallback){
  localFileCreate(this.user, newFilename, fileCreatorCallback);
};
everyone.now.s_deleteFile    = function(fname, fileDeleterCallback){
  var usersInFile = myFs.usersInGroup[this.user.teamID+fname];
  if(usersInFile === undefined || usersInFile === 0){
    localFileDelete(this.user, fname, fileDeleterCallback);
  }else{
    console.log("Cannot delete file. There are users in it! " + this.user.teamID+" >> "+fname);
    fileCallback(fname, ["Cannot delete file. There are users in it!"]);
  }
};
everyone.now.s_renameFile    = function(fname, newFName, fileRenamerCallback){
  var usersInFile = myFs.usersInGroup[this.user.teamID+fname];
  if(usersInFile === undefined || usersInFile === 0){
    localFileRename(this.user, fname, newFName, fileRenamerCallback);
  }else{
    console.log("Cannot rename file. There are users in it! " + this.user.teamID+" >> "+fname);
    fileCallback(fname, ["Cannot rename file. There are users in it!"]);
  }
};
everyone.now.s_duplicateFile = function(fname, newFName, fileDuplicatorCallback){
  localFileDuplicate(this.user, fname, newFName, fileDuplicatorCallback);
};
everyone.now.s_commitProject = function(txt, committerCallback){
  var team = this.user.teamID;
  console.log("committing project... >> " + team);
  var teamProjGitPath = EDITABLE_APPS_DIR+team;
  // this only needs done when a new repo is created...
  //localRepoInitBare(teamProjGitPath, function(err){});
  localRepoCommit(this.user, teamProjGitPath, txt, function(err){
    if(err) {
       console.log(err);
    }
    committerCallback(err);
  });
};
everyone.now.s_fetchProjectCommits = function(fetcherCallback){
  var team = this.user.teamID;
  console.log("fetching project commits... >> " + team);
  var teamProjGitPath = EDITABLE_APPS_DIR+team;
  localRepoFetchGitLog(this.user, teamProjGitPath, "", function(err, gitlog){
    if(err) {
       console.log(err);
       if(err && err[0] && err[0].indexOf("Not a git repository") > 0){
         localRepoInitBare(teamProjGitPath, function(err){
           if(err){
             console.log("ERROR INITITIALIZING GIT REPO.");
           }else{
            console.log("Returned from git repo init.");
           }
         });
       }
    }
    fetcherCallback(gitlog);
  });
};
everyone.now.s_deployProject = function(txt, deployerCallback){
  var team = this.user.teamID;
  console.log("DEPLOYING Project >> " + team);
  localProjectDeploy(this.user, deployerCallback);
};

console.log(".----------------------------------.");
console.log("| *. Space running on port "+ app.get('port') +" .* |");
console.log("'----------------------------------'");

