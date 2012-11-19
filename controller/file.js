/**
 * Local file stuff
 * @return {}
 */
module.exports = function(){

  // Cache with file size for each opened file
  var fileSizeCache  = this.fileSizeCache = {};

  // Cache with TODOs for each opened file
  var fileTodoCache  = this.fileTodoCache = {};

  // Cache with FIXMEs for each opened file
  var fileFixMeCache = this.fileFixMeCache = {};

  // Array of flags indicating if a file has been modified since last save.
  var localFileIsMostRecent = this.localFileIsMostRecent = [];


  // FIXME: Use localFileCreate
  /**
   * Create a file in the filesystem
   * @param  {ClientRequest} req The request from the client
   * @param  {ServerResponse} res The response to the client
   * @return {}
   */
  this.createFile = function(req, res){

    console.log(blue + "CREATE FILE ["+req.session.user.email+"]");

    // If the user is in a project and set a name for the file
    if(req.query.project && req.query.project.length > 2 && req.body.fname){
      //Get the project name
      var projectName = req.query.project.replace(/\.\./g, "");
      // Get the file the user set
      var fname = req.body.fname;
      // Validate the file name
      if(!fname || fname.length < 2){
        return;
      }

      // Transform the file name so it does not navigate into the FS
      var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
      // Path to create the file
      var path = EDITABLE_APPS_DIR+projectName+"/"+safeFName;

      try{
        // Tests if the file already exists
        fs.realpathSync(path);
        console.log("file already exists.. no need to create it: " + path);
        res.send("FAIL: File already exists. No need to create it.");
      }catch(ex){
        console.log("file doesn't exist yet. creating it: " + path);

        // Writing content of the file
        fs.writeFile(path, "", "utf8", function(err) {
          // Error writing the file
          if(err) {
            // TODO: Delete the file created??
            console.log(err);
            res.send("FAIL: Error creating new file.");
          } else {
            // Mark file as saved with no pending changes.
            localFileIsMostRecent[projectName+"/"+safeFName] = true;
            console.log("FILE SAVED: " + safeFName);
            res.send(safeFName);
          }
        });
      }
    }else{
      res.send("FAIL: no project and/or filename.");
    }
  }

  // FIXME: Use localFileRename
  /**
   * Rename a given file
   * @param  {ClientRequest} req The request from the client
   * @param  {ServerResponse} res The response to the client
   * @return {}
   */
  this.renameFile = function(req, res){

    console.log("RENAME FILE ["+req.session.user.email+"]");

    // If the user is in a project and set a new filename for the file
    if(req.query.project && req.query.project.length > 2 && req.body.fname && req.body.newfname){
      //Get the project name
      var projectName = req.query.project.replace(/\.\./g, "");
      // Get the original filename
      var fname = req.body.fname;
      // Validate the original filename
      if(!fname || fname.length < 2){
        return;
      }

      // Get the new filename
      var newfname = req.body.newfname;
      // Validate the new filename
      if(!newfname || newfname.length < 2){
        return;
      }

      // Transform the original filename so it does not navigate into the FS
      var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');

      // Transform the new filename so it does not navigate into the FS
      var safeNewFName = newfname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');

      // Path of the original file
      var pathA = EDITABLE_APPS_DIR+projectName+"/"+safeFName;

      // Path where to create the new file
      var pathB = EDITABLE_APPS_DIR+projectName+"/"+safeNewFName;

      try{
        // Tests if the original file exists
        fs.realpathSync(pathA);

        try{
          // Tests if the new file already exists
          fs.realpathSync(pathB);

          // if pathB exists, don't do the rename -- it will copy over an existing file!
          console.log("trying to rename file to something that already exists: " + pathA + " >> " + pathB);
          return res.send("FAIL: Cannot rename a file to something that already exists.");
        }catch(ex2){
          // ok, all set!
          // Try to rename the file
          fs.rename(pathA, pathB, function (err) {
            // Error while renaming file
            if (err){
              console.log(err);
              res.send("FAIL: Error renaming file.");
            }
            // Successfully renamed the file
            console.log("successfully renamed file ["+req.session.user.email+"]: " + pathA + " >> " + pathB);
            res.send(safeNewFName);
          });
        }
      }catch(ex){
        // If the original file dos noe exist
        console.log("trying to rename a file that doesn't exist: " + pathA);
        return res.send("FAIL: File doesn't exist. Cannot rename it.");
      }
    }else{
      // If no filenames or project were set
      res.send("FAIL: no project and/or filename.");
    }
  }

  // FIXME: Use localFileDelete
  /**
   * Delete a file
   * @param  {ClientRequest} req The request from the client
   * @param  {ServerResponse} res The response to the client
   * @return {}
   */
  this.deleteFile = function(req, res){
    console.log("DELETE FILE ["+req.session.user.email+"]");

    // If the user is in a project and there's the filename for the file to be deleted
    if(req.query.project && req.query.project.length > 2 && req.body.fname){
      //Get the project name
      var projectName = req.query.project.replace(/\.\./g, "");
      // Get the filename for the file to be deleted
      var fname = req.body.fname;
      // Validate filename of the file to be deleted
      if(!fname || fname.length < 2){
        return;
      }

      // Transform the filename so it does not navigate into the FS
      var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');

      // Path of the file to be deleted
      var path = EDITABLE_APPS_DIR+projectName+"/"+safeFName;

      // If there's users editing, do no let the user delete the file
      if(fg.usersInGroup[projectName+"/"+safeFName]){
        console.log("Delete stopped, users still in file: "+path);
        return res.send("FAIL: users still in file.");
      }
      try{
        // Tests if the file exists
        fs.realpathSync(path);
        console.log("file exists.. delete it: " + path);

        // If the file exists, delete it
        fs.unlink(path, function (err) {
          // Error while deleting file
          if (err){
            console.log(err);
            return res.send("FAIL: could not delete file.");
          }
          // Successfully deleted file
          console.log("successfully deleted: " + path);
          return res.send(safeFName);
        });
      }catch(ex){
        // If the file does not exist
        return res.send("FAIL: File doesn't exist. No need to delete it.");
      }
    }else{
      // If the user is not in a project or did not set a file to be deleted
      res.send("FAIL: no project and/or filename.");
    }
  }

  // FIXME: Use localFileDelete
  /**
   * Duplicate a file
   * @param  {ClientRequest} req The request from the client
   * @param  {ServerResponse} res The response to the client
   * @return {}
   */
  this.duplicateFile = function(req, res){
    console.log("DUPLICATE FILE ["+req.session.user.email+"]");

    // If the user is in a project and set a new filename for the file
    if(req.query.project && req.query.project.length > 2 && req.body.fname && req.body.newfname){
      //Get the project name
      var projectName = req.query.project.replace(/\.\./g, "");
      // Get the original filename
      var fname = req.body.fname;
      // Validate the original filename
      if(!fname || fname.length < 2){
        return;
      }

      // Get the new filename
      var newfname = req.body.newfname;
      // Validate the new filename
      if(!newfname || newfname.length < 2){
        return;
      }

      // Transform the original filename so it does not navigate into the FS
      var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');

      // Transform the new filename so it does not navigate into the FS
      var safeNewFName = newfname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');

      // Path of the original file
      var pathA = EDITABLE_APPS_DIR+projectName+"/"+safeFName;

      // Path where to create the new file
      var pathB = EDITABLE_APPS_DIR+projectName+"/"+safeNewFName;

      try{
         // Tests if the original file exists
        fs.realpathSync(pathA);

        try{
          // Tests if the new file already exists
          fs.realpathSync(pathB);

          // if pathB exists, don't do the rename -- it will copy over an existing file!
          console.log("trying to duplicate file to something that already exists: " + pathA + " >> " + pathB);
          return res.send("FAIL: Cannot duplicate a file to something that already exists.");
        }catch(ex2){
          // ok, all set!
          var is = fs.createReadStream(pathA);  // To read the file
          var os = fs.createWriteStream(pathB); // To write the file

          // Write the data in the new file
          is.pipe(os, function(err){
            // If there's an error while writing the content in the new file
            if (err){
              console.log(err);
              return res.send("FAIL: Error duplicating file.");
            }
            // Successfully duplicated file
            console.log("successfully duplicated file ["+req.session.user.email+"]: " + pathA + " >> " + pathB);
            return res.send(safeNewFName);
          });
        }
      }catch(ex){
        // If the orifinal file does not exist
        console.log("trying to duplicate a file that doesn't exist: " + pathA);
        return res.send("FAIL: File doesn't exist. Cannot duplicate it.");
      }
    }else{
      // If there is no project/filenames set
      res.send("FAIL: no project and/or filename.");
    }
  }



  /**
   * Fetches the local file to send to the user
   * @param  {object} userObj  The object representing the user
   * @param  {string} fname               Name of the file to fetch
   * @param  {Function} fileRequester     Callback Callback functions
   * @return {}
   */
  this.localFileFetch = function(userObj, fname, fileRequesterCallback){
    // Get the team of the user
    var team = userObj.TEAM_ID;

    // Try to read the file
    fs.readFile(EDITABLE_APPS_DIR+team+"/"+fname, "utf-8", function (err, data) {
      // Error while reading the file
      if (err){
        console.warn("couldn't open: "+team+"/"+fname);
      }
      // Call the callback function
      fileRequesterCallback(fname, data, err, true);
    });
  }

  /**
   * Save a file sent by a user
   * @param  {object} userObj      The object representing the user
   * @param  {string} fname                   Name of the file to write into
   * @param  {string} fcontents               The data to write
   * @param  {Function} fileRequesterCallback Callback functions
   * @return {}
   */
  this.localFileSave = function(userObj, fname, fcontents, fileSaverCallback){
    // Get the team of the user
    var team = userObj.TEAM_ID;

    // Try to save the contents of the file
    fs.writeFile(EDITABLE_APPS_DIR+team+"/"+fname, fcontents, function(err) {
        // Error while saving file
        if(err) {
            console.log(err);
        } else {
          // Mark file as saved with no pending changes.
          localFileIsMostRecent[team+"/"+fname] = true;

          console.log("FILE SAVED: " + team+"/"+fname);

          // Get the users editing the file
          var filegroup = nowjs.getGroup(team+"/"+fname);

          // Broadcast thet the file is saved (the changes are sent by other functions)
          filegroup.now.c_fileStatusChanged(fname, "saved");

          // Setting file size and FIXME/TODO number
          var sz = fcontents.length;
          fileSizeCache[team+"/"+fname] = sz;
          if(sz < 1000000){
            fileTodoCache[team+"/"+fname]  = utl.occurrences(fcontents, "TODO");
            fileFixMeCache[team+"/"+fname] = utl.occurrences(fcontents, "FIXME");
          }
        }
      // Call the callback function
      fileSaverCallback(err);
    });
  }

  /**
   * Creates a local file
   * @param  {object} userObj    The object representing the user
   * @param  {string} fname                 Name of the file to fetch
   * @param  {Function} fileCreatorCallback Callback Callback functions
   * @return {}
   */
  this.localFileCreate = function(userObj, fname, fileCreatorCallback){
    // Get the user group
    var team = userObj.TEAM_ID;

    // If there's no file name set
    if(!fname){
      return;
    }

    // Transform the file name so it does not navigate into the FS
    var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
    // Path to create the file
    var path = EDITABLE_APPS_DIR+team+"/"+safeFName;

    try{
      // Tests if the file already exists
      fs.realpathSync(path);
      console.log("file already exists.. no need to create it: " + path);
      res.send("FAIL: File already exists. No need to create it.");
    }catch(ex){
      console.log("file doesn't exist yet. creating it: " + path);

      // Writing content of the file
      fs.writeFile(path, "", "utf8", function(err) {
        // Error writing the file
        if(err) {
          // TODO: Delete the file created??
          console.log(err);
          res.send("FAIL: Error creating new file.");
        } else {
          // Mark file as saved with no pending changes.
          localFileIsMostRecent[projectName+"/"+safeFName] = true;
          console.log("FILE SAVED: " + safeFName);

          // Tell to the file group that the file was saved
          var filegroup = nowjs.getGroup(TEAM_ID+safeFName);
          filegroup.now.c_fileStatusChanged(safeFName, "saved");
        }

        // Tell to the team that the file was created
        var teamgroup  = nowjs.getGroup(userObj.TEAM_ID);
        var fromUserId = userObj.clientId;
        teamgroup.now.c_processUserFileEvent(safeFName, "createFile", fromUserId, 0);

        // Call the callback function
        fileCreatorCallback(safeFName, err);
      });
    }
  }

  /**
   * Deletes a locel file
   * @param  {object} userObj    The object representing the user
   * @param  {string} fname                 Name of the file to fetch
   * @param  {Function} fileDeleterCallback Callback Callback functions
   * @return {}
   */
  this.localFileDelete = function(userObj, fname, fileDeleterCallback){
    // Get the user group
    var team = userObj.TEAM_ID;

    // If there's no file name set
    if(!fname){
      return;
    }

    // Transform the file name so it does not navigate into the FS
    var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');
    // Path to create the file
    var path = EDITABLE_APPS_DIR+projectName+"/"+safeFName;

   try{
      // Tests if the file exists
      fs.realpathSync(path);
      console.log("file exists.. delete it: " + path);

      // If the file exists, delete it
      fs.unlink(path, function (err) {
        // Error while deleting file
        if (err){
          console.log(err);
          throw err;
        }
        // Successfully deleted file
        console.log("successfully deleted: " + path);

        // Tell to the team that the file was deleted
        var teamgroup  = nowjs.getGroup(userObj.TEAM_ID);
        var fromUserId = userObj.clientId;
        teamgroup.now.c_processUserFileEvent(safeFName, "deleteFile", fromUserId, 0);

        //Call the callback function
        fileDeleterCallback(safeFName, []);
      });
    }catch(ex){
      console.log("trying to delete file, but it doesn't exist: " + path);
      fileDeleterCallback(safeFName, ["File doesn't exist. No need to delete it."]);
    }
  }

  /**
   * Renames a local file
   * @param  {object} userObj    The object representing the user
   * @param  {string} fname                 Name of the file to fetch
   * @param  {string} newFName              The name of the new file
   * @param  {Function} fileRenamerCallback Callback Callback functions
   * @return {}
   */
  this.localFileRename = function(userObj, fname, newFName, fileRenamerCallback){
    // Get the user group
    var team = userObj.TEAM_ID;

    // If there's no file name set
    if(!fname){
      return;
    }

    // Transform the original filename so it does not navigate into the FS
    var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');

    // Transform the new filename so it does not navigate into the FS
    var safeNewFName = newfname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');

    // Path of the original file
    var pathA = EDITABLE_APPS_DIR+projectName+"/"+safeFName;

    // Path where to create the new file
    var pathB = EDITABLE_APPS_DIR+projectName+"/"+safeNewFName;

    try{
      // Tests if the original file exists
      fs.realpathSync(pathA);

      try{
        // Tests if the new file already exists
        fs.realpathSync(pathB);

        // if pathB exists, don't do the rename -- it will copy over an existing file!
        console.log("trying to rename file to something that already exists: " + pathA + " >> " + pathB);
        fileRenamerCallback(safeFName, ["Cannot rename a file to something that already exists."]);
      }catch(ex2){
        // ok, all set!
        // Try to rename the file
        fs.rename(pathA, pathB, function (err) {
          // Error while renaming file
          if (err){
            console.log(err);
            throw err;
          }
          // Successfully renamed the file
          console.log("successfully renamed file ["+req.session.user.email+"]: " + pathA + " >> " + pathB);

          // Tell to the team that the file was renamed
          var teamgroup  = nowjs.getGroup(userObj.TEAM_ID);
          var fromUserId = userObj.clientId;
          teamgroup.now.c_processUserFileEvent(safeFName, "renameFile", fromUserId, 0, safeNewFName);

          // Call the callback function
          fileRenamerCallback(safeFName, []);
        });
      }
    }catch(ex){
      console.log("trying to rename a file that doesn't exist: " + pathA);
      fileRenamerCallback(safeFName, ["File doesn't exist. Cannot rename it."]);
    }
  }

  /**
   * Duplicates a local file
   * @param  {object} userObj    The object representing the user
   * @param  {string} fname                 Name of the file to fetch
   * @param  {string} newFName              The name of the new file
   * @param  {Function} fileDuplicatorCallback Callback Callback functions
   * @return {}
   */
  this.localFileDuplicate = function(userObj, fname, newFName, fileDuplicatorCallback){
    // Get the user group
    var team = userObj.TEAM_ID;

    // If there's no file name set
    if(!fname){
      return;
    }

    // Transform the original filename so it does not navigate into the FS
    var safeFName = fname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');

    // Transform the new filename so it does not navigate into the FS
    var safeNewFName = newfname.split("..").join("").replace(/[^a-zA-Z_\.\-0-9\/\(\)]+/g, '');

    // Path of the original file
    var pathA = EDITABLE_APPS_DIR+projectName+"/"+safeFName;

    // Path where to create the new file
    var pathB = EDITABLE_APPS_DIR+projectName+"/"+safeNewFName;

    try{
      // Tests if the original file exists
      fs.realpathSync(pathA);

      try{
        // Tests if the new file already exists
        fs.realpathSync(pathB);

        // if pathB exists, don't do the rename -- it will copy over an existing file!
        console.log("trying to duplicate file but it already exists: " + pathA + " >> " + pathB);
        fileDuplicatorCallback(safeFName, ["Cannot duplicate a file to something that already exists."]);
      }catch(ex2){
        // ok, all set!
        var is = fs.createReadStream(pathA);  // To read the file
        var os = fs.createWriteStream(pathB); // To write the file

        // Write the data in the new file
        is.pipe(os, function(err){
          // If there's an error while writing the content in the new file
          if (err){
            console.log(err);
            throw err;
          }
          // Successfully duplicated file
          console.log("successfully duplicated file ["+req.session.user.email+"]: " + pathA + " >> " + pathB);

          // Tell to the team that the file was duplicated
          var teamgroup  = nowjs.getGroup(userObj.TEAM_ID);
          var fromUserId = userObj.clientId;
          teamgroup.now.c_processUserFileEvent(safeFName, "duplicateFile", fromUserId, 0, safeNewFName);

          // Call the callback function
          fileDuplicatorCallback(safeFName, []);
        });
      }
    }catch(ex){
      console.log("trying to dupicate a file that doesn't exist: " + pathA);
      fileDuplicatorCallback(safeFName, ["File doesn't exist. Cannot duplicate it."]);
    }
  }
}
