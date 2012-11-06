exports.route = function() {
  var restrict    = auth.restrict
    , occurrences = utl.occurrences
    ;

  // TODO: check credentials before doing any of these GET/POST...
  app.get("/allProjectFiles", restrict, function(req, res){
    if(req.query.project && req.query.project.length > 2){
      var project = req.query.project.replace(/\.\./g, "");
      var projectRoot = EDITABLE_APPS_DIR+project;

      console.log("Listing all project files [" + projectRoot + "] for user: " +
        req.cookies._username + " --> (~"+fg.usersInGroup[project]+" sockets)");
      try{

        var walker = walk.walk(projectRoot, {followLinks: false});
        var filesAndInfo = [];
        walker.on("names", function (root, nodeNamesArray) {
          // use this to remove/sort files before doing the more expensive "stat" operation.
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
          var sz = myFs.fileSizeCache[project+"/"+fname];
          if(sz === undefined){
            // first time checking files size.. get it!
            sz = fileStats.size;
            myFs.fileSizeCache[project+"/"+fname] = sz;
          }
          var td = myFs.fileTodoCache[project+"/"+fname];
          var fd = null;
          if(td === undefined && sz < 1000000){
            fd = fs.readFileSync(projectRoot+"/"+fname, "utf8");
            td = occurrences(fd, "TODO");
            myFs.fileTodoCache[project+"/"+fname] = td;
          }
          var fm = myFs.fileFixMeCache[project+"/"+fname];
          if(fm === undefined && sz < 1000000){
            if(fd === null){
              fd = fs.readFileSync(projectRoot+"/"+fname, "utf8");
            }
            fm = occurrences(fd, "FIXME");
            myFs.fileFixMeCache[project+"/"+fname] = fm;
          }
          var n = fg.usersInGroup[project+"/"+fname];
          if(n){
            filesAndInfo.push([fname, n, sz, td, fm]);
          }else{
            filesAndInfo.push([fname, 0, sz, td, fm]);
          }
          fd = null;
          next();
        });
        walker.on("end", function() {
        //console.log("Recursively listed project files for: " + project);
        // indicate total team members online.
        var n = fg.usersInGroup[project];
        if(n){
          filesAndInfo.push(["", n]);
        }else{
          filesAndInfo.push(["", 0]);
        }
        res.send(JSON.stringify(filesAndInfo));
        //callback(null, filesAndInfo);
      });
      }catch(ex){
        console.log("*** exception walking files!");
        console.log(ex);
      }
    }else{
      res.send("FAIL: no project name.");
    }
  });
  app.post("/launchProject", restrict, function(req, res){
    if(!ENABLE_LAUNCH){
      res.send("FAIL: Sorry, but launching projects is not currently enabled.");
      return;
    }
    if(req.query.project && req.query.project.length > 2){
      var projectName = req.query.project.replace(/\.\./g, "");
      console.log("LAUNCHING Project [" + req.user.name + "] >> " + projectName);
      var projPath = EDITABLE_APPS_DIR+projectName;
      exec('stop node_'+projectName, {
          encoding: 'utf8',
          timeout: 30000,
          maxBuffer: 200*1024,
          killSignal: 'SIGTERM',
          env: null
        },
        function (error, stdout, stderr) {
          if (error !== null) {
            console.log('exec error: ' + error);
            // return res.send("FAIL:");
          }
          console.log("STOP: " + stdout);
          exec('start node_'+projectName, {
              encoding: 'utf8',
              timeout: 30000,
              maxBuffer: 200*1024,
              killSignal: 'SIGTERM',
              env: null
            },
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
  });



  app.get("/allUsersEditingProjectsIFrame", function(req, res){
    var html = "<html></head><script src='https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'></script><head><body><script>";
    //html += "var u = "+JSON.stringify(nowUsersList)+";";
    html += "function receiveMessage(event){var o = event.origin; var p = parent; $.get('/allUsersEditingProjects', function(data){p.postMessage(JSON.parse(data), o);});};";
    html += "window.addEventListener('message', receiveMessage, false);";
    html += "</script></body></html>";
    res.send(html);
  });
  app.get("/allUsersEditingProjects", function(req, res){
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
  });
}
