var everyone = nowjs.initialize(
    server,
    {socketio: {
        "transports": [
          "htmlfile",
          "xhr-polling",
          "jsonp-polling",
          "flashsocket"
        ]
    }}
  );

this.config = function() {
  nowjs.on('connect', function () {

    if(this.now.TEAM_ID != '' && this.now.TEAM_ID != null){
      this.user.TEAM_ID = this.now.TEAM_ID;
    } else {
      this.user.TEAM_ID   = TEAM_ID;
      this.now.TEAM_ID    = TEAM_ID;
    }

    var now = this.now;
    var usr = this.user;

    user.getByEmail( this.user.cookie['_username'], function(u){
      if(u){
        // now populate it..
        usr.about       = {};
        usr.about._id   = u.email;
        usr.about.name  = u.name;
        usr.about.picture  = u.picture;

        // -----
        now.username = usr.about.name;
        now.picture  = usr.about.picture;
        now.email    = u.email;
        // -----

        // file groups starts out empty.
        usr.grouplist = [];

        // the blank file group is the the team group.
        fg.addUserToFileGroup(usr, "");

        // Confirm the project to the user
        now.c_confirmProject(usr.TEAM_ID);
      }
    });


  });

  nowjs.on('disconnect', function () {
    var teamgroup  = nowjs.getGroup(this.user.TEAM_ID);

    // remove user from all file groups.
    if(this.user.grouplist !== undefined){
      for(var i=this.user.grouplist.length-1; i>=0; i--){
        var g = this.user.grouplist[i];
        var fname = g.substring(g.indexOf("/")+1);
        fg.usersInGroupMinusMinus(g);
        teamgroup.now.c_processUserFileEvent(fname, "leaveFile", this.user.clientId, myFs.usersInGroup[g]);
      }
    }
  });
}

this.route = function() {
  /**
   * Send user's cursor to all users in file
   * @param  {string} fname          the name of the file
   * @param  {object} range          the cursor position range
   * @param  {boolean} changedByUser if the file was changed by this user
   * @return {}
   */
  everyone.now.s_sendCursorUpdate = function(fname, range, changedByUser){
    var userObj = this.user;
    var filegroup = nowjs.getGroup(userObj.TEAM_ID+"/"+fname);

    var _usersIngroup = "";
    var users = filegroup.users;
    for (userInUsers in users) {
      _usersIngroup += '        [ ' + userInUsers+ ': ' + users[userInUsers].user.about.name +' ]\n';
    }

    filegroup.now.c_updateCollabCursor(this.user.clientId, this.now.username, range, changedByUser);
  };

  everyone.now.s_sendDiffPatchesToCollaborators = function(fname, patches, crc32){
    var userObj = this.user;
    myFs.localFileIsMostRecent[userObj.TEAM_ID+"/"+fname] = false; // mark file as changed.
    var filegroup = nowjs.getGroup(userObj.TEAM_ID+"/"+fname);
    filegroup.now.c_updateWithDiffPatches(this.user.clientId, patches, crc32);
  };


  everyone.now.showFnChat = function(fname, line){
    docs.showFnChat(this.user, fname, line)
  }

  // NOW: Remote file tools.
  everyone.now.s_getLatestFileContentsAndJoinFileGroup = function(fname, fileRequesterCallback){
    var callerID = this.user.clientId;
    var userObj = this.user;

    fg.addUserToFileGroup(userObj, fname);

    //removeUserFromAllFileGroupsAndAddToThis(origUser, fname);
    if(myFs.localFileIsMostRecent[userObj.TEAM_ID+"/"+fname] === true || myFs.localFileIsMostRecent[userObj.TEAM_ID+"/"+fname] === undefined){
      myFs.localFileFetch(userObj, fname, fileRequesterCallback);
      //console.log("FILE FETCH: " + userObj.TEAM_ID + " >> " + fname + ", by user: " + (userObj.about.name || callerID));
    }else{
      console.log("FILE FETCH (passed to user): " + userObj.TEAM_ID + " >> " + fname + ", by user: " + callerID);
      var filegroup = nowjs.getGroup(userObj.TEAM_ID+"/"+fname);
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
          console.log("Flagged as changed, but no user with file: "+userObj.TEAM_ID+" >> "+fname+" >> FETCHING last saved.");
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
    var filegroup = nowjs.getGroup(userObj.TEAM_ID+"/"+fname);
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

  everyone.now.s_sendFileChatMessage = function(fname, message){
    var filegroup    = nowjs.getGroup(this.user.TEAM_ID+"/"+fname);
    var fromUserId   = this.user.clientId;
    var fromUserName = this.now.username;
    var date = moment().format('HH:mm');
    var pic = this.now.picture;
    filegroup.now.c_receiveFileChat(fname, message, fromUserId, fromUserName, date, pic);
  };

  everyone.now.s_teamMessageBroadcast      = function(type, message){
    var teamgroup  = nowjs.getGroup(this.user.TEAM_ID);
    var scope      = "team";
    var fromUserId = this.user.clientId;
    var fromUserName = this.now.username;
    var date = moment().format('HH:mm');
    var pic  = this.now.picture;
    teamgroup.now.c_receiveGlobalChatChat(message, fromUserId, fromUserName, date, pic);
  };

  everyone.now.s_sendFuncChatMessage = function(fname, funcName, message){
    //Lets start using the fileGroup
    // var filegroup    = nowjs.getGroup(this.user.TEAM_ID+"/"+fname + "::" + funcName);
    var funcgroup    = nowjs.getGroup(this.user.TEAM_ID+"/"+fname);
    var fromUserId   = this.user.clientId;
    var fromUserName = this.now.username;
    var date = moment().format('HH:mm');
    var pic = this.now.picture;
    funcgroup.now.c_receiveFuncChat(fname, funcName, message, fromUserId, fromUserName, date, pic);

    var email = this.now.email;
    var fullDate = moment().format();
    docs.addChatToFunction(this.user.TEAM_ID, fname, funcName, message, email, fullDate);
  };


  everyone.now.s_leaveFile                 = function(fname){
    var teamgroup  = nowjs.getGroup(this.user.TEAM_ID);
    var fromUserId = this.user.clientId;
    fg.removeUserFromFileGroup(this.user, fname);
  };
  everyone.now.s_sendUserEvent             = function(event){
    var teamgroup  = nowjs.getGroup(this.user.TEAM_ID);
    var fromUserId = this.user.clientId;
    var fromUserName = this.now.username;
    teamgroup.now.c_processUserEvent(event, fromUserId, fromUserName);
  };
  //-------
  everyone.now.s_getAllProjectsFiles = function(callback){
    var team = this.user.TEAM_ID;
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
    var usersInFile = myFs.usersInGroup[this.user.TEAM_ID+fname];
    if(usersInFile === undefined || usersInFile === 0){
      localFileDelete(this.user, fname, fileDeleterCallback);
    }else{
      console.log("Cannot delete file. There are users in it! " + this.user.TEAM_ID+" >> "+fname);
      fileCallback(fname, ["Cannot delete file. There are users in it!"]);
    }
  };
  everyone.now.s_renameFile    = function(fname, newFName, fileRenamerCallback){
    var usersInFile = myFs.usersInGroup[this.user.TEAM_ID+fname];
    if(usersInFile === undefined || usersInFile === 0){
      localFileRename(this.user, fname, newFName, fileRenamerCallback);
    }else{
      console.log("Cannot rename file. There are users in it! " + this.user.TEAM_ID+" >> "+fname);
      fileCallback(fname, ["Cannot rename file. There are users in it!"]);
    }
  };
  everyone.now.s_duplicateFile = function(fname, newFName, fileDuplicatorCallback){
    localFileDuplicate(this.user, fname, newFName, fileDuplicatorCallback);
  };
  everyone.now.s_commitProject = function(txt, committerCallback){
    var team = this.user.TEAM_ID;
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
    var team = this.user.TEAM_ID;
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
    var team = this.user.TEAM_ID;
    console.log("DEPLOYING Project >> " + team);
    localProjectDeploy(this.user, deployerCallback);
  };
}




    // var output = '{';
    // var object = range;
    // for (property in object) {
    //   var output2 = '';
    //   var object2 = object[property];
    //   for (property2 in object2) {
    //     output2 += '\n    ' + property2 + ': ' + object2[property2]+'; ';
    //   }
    //   output += '\n  ' + property + ': {' + output2 +'\n  },';
    // }
    // output += '\n}';
    // console.log("RANGE["+this.now.username+"]:\n" + output);







