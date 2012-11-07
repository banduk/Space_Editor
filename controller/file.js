
module.exports = function(){
  /**
   * local file stuff
   */
  var fileSizeCache = this.fileSizeCache = {};
  var fileTodoCache = this.fileTodoCache = {};
  var fileFixMeCache = this.fileFixMeCache = {};
  // an array of flags indicating if the file has been modified since last save.
  var localFileIsMostRecent = this.localFileIsMostRecent = [];


  this.createFile = function(req, res){
    console.log("CREATE FILE ["+req.session.user.username+"]");
    if(req.query.project && req.query.project.length > 2 && req.body.fname){
      var projectName = req.query.project.replace(/\.\./g, "");
      var fname = req.body.fname;
      if(!fname || fname.length < 2){
        return;
      }
      var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
      var path = EDITABLE_APPS_DIR+projectName+"/"+safeFName;
      try{
        fs.realpathSync(path);
        console.log("file already exists.. no need to create it: " + path);
        return res.send("FAIL: File already exists. No need to create it.");
      }catch(ex){
        console.log("file doesn't exist yet. creating it: " + path);

        fs.writeFile(path, "", "utf8", function(err) {
          if(err) {
            console.log(err);
            return res.send("FAIL: Error creating new file.");
          } else {
            // mark file as saved with no pending changes.
            myFs.localFileIsMostRecent[projectName+"/"+safeFName] = true;
            console.log("FILE SAVED: " + safeFName);
            res.send(safeFName);
          }
        });
      }
    }else{
      res.send("FAIL: no project and/or filename.");
    }
  }

  this.renameFile = function(req, res){
    console.log("RENAME FILE ["+req.session.user.username+"]");
    if(req.query.project && req.query.project.length > 2 && req.body.fname && req.body.newfname){
      var projectName = req.query.project.replace(/\.\./g, "");
      var fname = req.body.fname;
      if(!fname || fname.length < 2){
        return;
      }
      var newfname = req.body.newfname;
      if(!newfname || newfname.length < 2){
        return;
      }
      var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
      var safeNewFName = newfname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
      var pathA = EDITABLE_APPS_DIR+projectName+"/"+safeFName;
      var pathB = EDITABLE_APPS_DIR+projectName+"/"+safeNewFName;
      try{
        fs.realpathSync(pathA);
        try{
          fs.realpathSync(pathB);
          // if pathB exists, don't do the rename -- it will copy over an existing file!
          console.log("trying to rename file to something that already exists: " + pathA + " >> " + pathB);
          return res.send("FAIL: Cannot rename a file to something that already exists.");
        }catch(ex2){
          // ok, all set!
          //console.log("all set to rename file: " + pathA + " >> " + pathB);
          fs.rename(pathA, pathB, function (err) {
            if (err){
              console.log(err);
              return res.send("FAIL: Error renaming file.");
            }
            console.log("successfully renamed file ["+req.session.user.username+"]: " + pathA + " >> " + pathB);
            return res.send(safeNewFName);
          });
        }
      }catch(ex){
        console.log("trying to rename a file that doesn't exist: " + pathA);
        return res.send("FAIL: File doesn't exist. Cannot rename it.");
      }
    }else{
      res.send("FAIL: no project and/or filename.");
    }
  }

  this.deleteFile = function(req, res){
    console.log("DELETE FILE ["+req.session.user.username+"]");
    if(req.query.project && req.query.project.length > 2 && req.body.fname){
      var projectName = req.query.project.replace(/\.\./g, "");
      var fname = req.body.fname;
      if(!fname || fname.length < 2){
        return;
      }
      var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
      var path = EDITABLE_APPS_DIR+projectName+"/"+safeFName;
      if(fg.usersInGroup[projectName+"/"+safeFName]){
        console.log("Delete stopped, users still in file: "+path);
        return res.send("FAIL: users still in file.");
      }
      try{
        fs.realpathSync(path);
        console.log("file exists.. delete it: " + path);
        fs.unlink(path, function (err) {
          if (err){
            console.log(err);
            return res.send("FAIL: could not delete file.");
          }
          console.log("successfully deleted: " + path);
          return res.send(safeFName);
        });
      }catch(ex){
        return res.send("FAIL: File doesn't exist. No need to delete it.");
      }
    }else{
      res.send("FAIL: no project and/or filename.");
    }
  }

  this.duplicateFile = function(req, res){
    console.log("DUPLICATE FILE ["+req.session.user.username+"]");
    if(req.query.project && req.query.project.length > 2 && req.body.fname && req.body.newfname){
      var projectName = req.query.project.replace(/\.\./g, "");
      var fname = req.body.fname;
      if(!fname || fname.length < 2){
        return;
      }
      var newfname = req.body.newfname;
      if(!newfname || newfname.length < 2){
        return;
      }
      var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
      var safeNewFName = newfname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
      var pathA = EDITABLE_APPS_DIR+projectName+"/"+safeFName;
      var pathB = EDITABLE_APPS_DIR+projectName+"/"+safeNewFName;
      try{
        fs.realpathSync(pathA);
        try{
          fs.realpathSync(pathB);
          // if pathB exists, don't do the rename -- it will copy over an existing file!
          console.log("trying to duplicate file to something that already exists: " + pathA + " >> " + pathB);
          return res.send("FAIL: Cannot duplicate a file to something that already exists.");
        }catch(ex2){
          // ok, all set!
          var is = fs.createReadStream(pathA);
          var os = fs.createWriteStream(pathB);
          util.pump(is, os, function(err){
            if (err){
              console.log(err);
              return res.send("FAIL: Error duplicating file.");
            }
            console.log("successfully duplicated file ["+req.session.user.username+"]: " + pathA + " >> " + pathB);
            return res.send(safeNewFName);
          });
        }
      }catch(ex){
        console.log("trying to duplicate a file that doesn't exist: " + pathA);
        return res.send("FAIL: File doesn't exist. Cannot duplicate it.");
      }
    }else{
      res.send("FAIL: no project and/or filename.");
    }
  }



  // Fetches the local file to send to the user
  this.localFileFetch = function(userObj, fname, fileRequesterCallback){
    var team = userObj.TEAM_ID;
    fs.readFile(EDITABLE_APPS_DIR+team+"/"+fname, "utf-8", function (err, data) {
      if (err){
        console.warn("couldn't open: "+team+"/"+fname);
      }
      fileRequesterCallback(fname, data, err, true);
    });
  }

  // Save a file sent by a user
  this.localFileSave = function(userObj, fname, fcontents, fileSaverCallback){
    var team = userObj.TEAM_ID;
    fs.writeFile(EDITABLE_APPS_DIR+team+"/"+fname, fcontents, function(err) {
        if(err) {
            console.log(err);
        } else {
          localFileIsMostRecent[team+"/"+fname] = true;  // mark file as saved with no pending changes.
          console.log("FILE SAVED: " + team+"/"+fname);
          var filegroup = nowjs.getGroup(team+"/"+fname);
          filegroup.now.c_fileStatusChanged(fname, "saved");
          var sz = fcontents.length;
          fileSizeCache[team+"/"+fname] = sz;
          if(sz < 1000000){
            fileTodoCache[team+"/"+fname]  = utl.occurrences(fcontents, "TODO");
            fileFixMeCache[team+"/"+fname] = utl.occurrences(fcontents, "FIXME");
          }
        }
      fileSaverCallback(err);
    });
  }

  // Creates a local file
  this.localFileCreate = function(userObj, fname, fileCreatorCallback){
    var team = userObj.TEAM_ID;
    if(!fname){
      return;
    }
    var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
    var path = EDITABLE_APPS_DIR+team+"/"+safeFName;
    try{
      fs.realpathSync(path);
      console.log("file already exists.. no need to create it: " + path);
      fileCreatorCallback(safeFName, ["File already exists. No need to create it."]);
    }catch(ex){
      console.log("file doesn't exist yet. creating it: " + path);
      fs.writeFile(path, "", function(err) {
          if(err) {
              console.log(err);
          } else {
          localFileIsMostRecent[TEAM_ID+safeFName] = true;  // mark file as saved with no pending changes.
              console.log("FILE SAVED: " + safeFName);
          var filegroup = nowjs.getGroup(TEAM_ID+safeFName);
          filegroup.now.c_fileStatusChanged(safeFName, "saved");
          }
        var teamgroup  = nowjs.getGroup(userObj.TEAM_ID);
        var fromUserId = userObj.clientId;
        teamgroup.now.c_processUserFileEvent(safeFName, "createFile", fromUserId, 0);
        fileCreatorCallback(safeFName, err);
      });
    }
  }

  // Deletes a locel file
  this.localFileDelete = function(userObj, fname, fileDeleterCallback){
    var team = userObj.TEAM_ID;
    if(!fname){
      return;
    }
    var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
    var path = EDITABLE_APPS_DIR+team+"/"+safeFName;
    try{
      fs.realpathSync(path);
      console.log("all set to delete file: " + path);
      fs.unlink(path, function (err) {
          if (err) throw err;
          console.log("successfully deleted: " + path);
        var teamgroup  = nowjs.getGroup(userObj.TEAM_ID);
        var fromUserId = userObj.clientId;
        teamgroup.now.c_processUserFileEvent(safeFName, "deleteFile", fromUserId, 0);
        fileDeleterCallback(safeFName, []);
      });
    }catch(ex){
      console.log("trying to delete file, but it doesn't exist: " + path);
      fileDeleterCallback(safeFName, ["File doesn't exist. No need to delete it."]);
    }
  }

  // Renames a local file
  this.localFileRename = function(userObj, fname, newFName, fileRenamerCallback){
    var team = userObj.TEAM_ID;
    if(!fname || !newFName){
      return;
    }
    var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
    var safeNewFName = newFName.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
    var pathA = EDITABLE_APPS_DIR+team+"/"+safeFName;
    var pathB = EDITABLE_APPS_DIR+team+"/"+safeNewFName;
    try{
      fs.realpathSync(pathA);
      try{
        fs.realpathSync(pathB);
        // if pathB exists, don't do the rename -- it will copy over an existing file!
        console.log("trying to rename file to something that already exists: " + pathA + " >> " + pathB);
        fileRenamerCallback(safeFName, ["Cannot rename a file to something that already exists."]);
      }catch(ex2){
        // ok, all set!
        console.log("all set to rename file: " + pathA + " >> " + pathB);
        fs.rename(pathA, pathB, function (err) {
          if (err) throw err;
            console.log("successfully renamed file: " + pathA + " >> " + pathB);
          var teamgroup  = nowjs.getGroup(userObj.TEAM_ID);
          var fromUserId = userObj.clientId;
          teamgroup.now.c_processUserFileEvent(safeFName, "renameFile", fromUserId, 0, safeNewFName);
          fileRenamerCallback(safeFName, []);
        });
      }
    }catch(ex){
      console.log("trying to rename a file that doesn't exist: " + pathA);
      fileRenamerCallback(safeFName, ["File doesn't exist. Cannot rename it."]);
    }
  }

  //Duplicates a local file
  this.localFileDuplicate = function(userObj, fname, newFName, fileDuplicatorCallback){
    var team = userObj.TEAM_ID;
    if(!fname || !newFName){
      return;
    }
    var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
    var safeNewFName = newFName.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
    var pathA = EDITABLE_APPS_DIR+team+"/"+safeFName;
    var pathB = EDITABLE_APPS_DIR+team+"/"+safeNewFName;
    try{
      fs.realpathSync(pathA);
      try{
        fs.realpathSync(pathB);
        // if pathB exists, don't do the rename -- it will copy over an existing file!
        console.log("trying to duplicate file but it already exists: " + pathA + " >> " + pathB);
        fileDuplicatorCallback(safeFName, ["Cannot duplicate a file to something that already exists."]);
      }catch(ex2){
        // ok, all set!
        console.log("all set to duplicate file: " + pathA + " >> " + pathB);
        var is = fs.createReadStream(pathA);
        var os = fs.createWriteStream(pathB);
            util.pump(is, os, function(err){
          if (err) throw err;
            console.log("successfully duplicated file: " + pathA + " >> " + pathB);
          var teamgroup  = nowjs.getGroup(userObj.TEAM_ID);
          var fromUserId = userObj.clientId;
          teamgroup.now.c_processUserFileEvent(safeFName, "duplicateFile", fromUserId, 0, safeNewFName);
          fileDuplicatorCallback(safeFName, []);
        });
      }
    }catch(ex){
      console.log("trying to dupicate a file that doesn't exist: " + pathA);
      fileDuplicatorCallback(safeFName, ["File doesn't exist. Cannot duplicate it."]);
    }
  }
}
