exports.route = function() {
  app.post("/createFile", function(req, res){
    console.log("CREATE FILE ["+req.cookies.user.name+"]");
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
  });
  app.post("/deleteFile", function(req, res){
    console.log("DELETE FILE ["+req.cookies.user.name+"]");
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
  });
  app.post("/renameFile", function(req, res){
    console.log("RENAME FILE ["+req.cookies.user.name+"]");
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
            console.log("successfully renamed file ["+req.cookies.user.name+"]: " + pathA + " >> " + pathB);
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
  });
  app.post("/duplicateFile", function(req, res){
    console.log("DUPLICATE FILE ["+req.cookies.user.name+"]");
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
            console.log("successfully duplicated file ["+req.cookies.user.name+"]: " + pathA + " >> " + pathB);
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
  });
}


