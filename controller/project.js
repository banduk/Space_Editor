
/**
 * Project functions
 * @return {}
 */
module.exports = function(){

  /**
   * Gett al the files in a given project
   * @param  {ClientRequest} req The request from the client
   * @param  {ServerResponse} res The response to the client
   * @return {}
   */
  this.allProjectFiles = function(req, res){
    // If there's a project set in the request
    if(req.query.project && req.query.project.length > 2){
      // Get the name of the project
      var project = req.query.project.replace(/\.\./g, "");

      // Get the folder of the project
      var projectRoot = EDITABLE_APPS_DIR+project;

      console.log("Listing all project files [" + projectRoot + "] for user: " +
        req.session.user.username + " --> (~"+fg.usersInGroup[project]+" sockets)");


      // Try to walk inside the project looking for files
      try{
        var walker = walk.walk(projectRoot, {followLinks: false});
        var filesAndInfo = [];

        // Not being used right now, but usefull for file sorting cause it passes only by file names
        // before getting file infos
        /*walker.on("names", function (root, nodeNamesArray) {
          // use this to remove/sort files before doing the more expensive "stat" operation.
          for(var i=nodeNamesArray.length-1; i>=0; i--){
            if(nodeNamesArray[i] == ".git" || nodeNamesArray[i] == "node_modules" || nodeNamesArray[i] == "_db"){
              nodeNamesArray.splice(i, 1);
            }
          }
        });*/

        // Walk trough all files
        walker.on("file", function (root, fileStats, next) {
          // The address of the root folder
          var rt = root.substring(projectRoot.length+1);
          if(rt.length > 0){
            rt += "/";
          }

          // Get the name
          var fname = rt + fileStats.name;
          // Get the size
          var sz = myFs.fileSizeCache[project+"/"+fname];

          // If the file does not have a defined size in the cache, set it
          if(sz === undefined){
            sz = fileStats.size;
            myFs.fileSizeCache[project+"/"+fname] = sz;
          }

          // Get TODOs and add to the TODOs cache
          var td = myFs.fileTodoCache[project+"/"+fname];
          var fd = null;
          if(td === undefined && sz < 1000000){
            fd = fs.readFileSync(projectRoot+"/"+fname, "utf8");
            td = utl.occurrences(fd, "TODO:");
            myFs.fileTodoCache[project+"/"+fname] = td;
          }

          // Get FIXMEs and add to the TODOs cache
          var fm = myFs.fileFixMeCache[project+"/"+fname];
          if(fm === undefined && sz < 1000000){
            if(fd === null){
              fd = fs.readFileSync(projectRoot+"/"+fname, "utf8");
            }
            fm = utl.occurrences(fd, "FIXME:");
            myFs.fileFixMeCache[project+"/"+fname] = fm;
          }

          // Get the number of users editing file
          var n = fg.usersInGroup[project+"/"+fname];

          // Save the file infos in the list of files of the project
          filesAndInfo.push([fname, n || 0, sz, td, fm]);

          fd = null;
          next();
        });

        // When there's no more files/folders
        walker.on("end", function() {
        // indicate total team members online.
        var n = fg.usersInGroup[project];
        filesAndInfo.push(["", n || 0]);

        // Send info to user
        res.send(JSON.stringify(filesAndInfo));
      });
      }catch(ex){
        console.log("*** exception walking files!");
        console.log(ex);
      }
    }else{
      res.send("FAIL: no project name.");
    }
  }

  /**
   * Launching the project
   * @param  {ClientRequest} req The request from the client
   * @param  {ServerResponse} res The response to the client
   * @return {}
   */
  this.launchProject = function(req, res){
    // If the launching function is not enabled
    if(!ENABLE_LAUNCH){
      res.send("FAIL: Sorry, but launching projects is not currently enabled.");
      return;
    }

    // If there's a project set in the request
    if(req.query.project && req.query.project.length > 2){
      // Get the name of the project
      var project = req.query.project.replace(/\.\./g, "");

      console.log("LAUNCHING Project [" + req.session.user.username + "] >> " + projectName);

      // Get the folder of the project
      var projectRoot = EDITABLE_APPS_DIR+project;

      // If the project is running, stop it
      exec('stop node_'+projectName, {
          encoding: 'utf8',
          timeout: 30000,
          maxBuffer: 200*1024,
          killSignal: 'SIGTERM',
          env: null
        },
        // Show errors
        function (error, stdout, stderr) {
          if (error !== null) {
            console.log('exec error: ' + error);
            // return res.send("FAIL:");
          }
          console.log("STOP: " + stdout);

          // Start project again
          exec('start node_'+projectName, {
              encoding: 'utf8',
              timeout: 30000,
              maxBuffer: 200*1024,
              killSignal: 'SIGTERM',
              env: null
            },

            // Show errors
            function (error, stdout, stderr) {
              if (error !== null) {
                console.log('exec error: ' + error);
                return res.send("FAIL:");
              }
              var launchURL = "http://"+projectName.toLowerCase()+".chaoscollective.org/";
              console.log("START: " + stdout);
              console.log("DEPLOY SUCCESSFUL: " + launchURL);
              res.send("ok");
            }
          ); // exec 2
        }
      ); // exec 1
    }else{
      res.send("FAIL: no project name.");
    }
  }


  this.allUsersEditingProjectsIFrame = function(req, res){
    var html = "<html></head><script src='https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'></script><head><body><script>";
    //html += "var u = "+JSON.stringify(nowUsersList)+";";
    html += "function receiveMessage(event){var o = event.origin; var p = parent; $.get('/allUsersEditingProjects', function(data){p.postMessage(JSON.parse(data), o);});};";
    html += "window.addEventListener('message', receiveMessage, false);";
    html += "</script></body></html>";
    res.send(html);
  }

  this.allUsersEditingProjects = function(req, res){
    var nowUsers = everyone.users || {}; //nowjs.server.connected || {};
    var nowUsersList = [];
    _.each(nowUsers, function(val, name){
      var u = (val||{}).user || {};
      var a = u.about || {};
      a.grouplist = u.grouplist;
      nowUsersList.push(a);
    });

    var html = "<html></head><head><body><script>";
    html += "var u = "+JSON.stringify(nowUsersList)+";";
    html += "function receiveMessage(event){parent.postMessage(u, event.origin);};";
    html += "window.addEventListener('message', receiveMessage, false);";
    html += "</script></body></html>";
    res.send(html);

    res.send(JSON.stringify(nowUsersList));
  }

}
