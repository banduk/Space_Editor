var rt         = require('./rt')
  , restrict   = auth.restrict
  , unrestrict = auth.unrestrict
  ;


exports.route = function() {

  /**
   * Real time stuff
   */
  rt.route();
  rt.config();

  /**
   * User routes
   */
  app.get ('/',       restrict,   user.index);
  app.get ('/signup', unrestrict, user.signup);
  app.post('/signup', unrestrict, user.doSignup);
  app.get ('/login',  unrestrict, user.login);
  app.post('/login',  unrestrict, user.doLogin);
  app.get ('/logout', restrict,   user.Logout);

  //DOCS
  //app.get ('/doc', function(req, res){req.url = 'docs/index.html'});

  /**
   * File routes
   */
  app.post("/createFile", restrict,    myFs.createFile);
  app.post("/deleteFile", restrict,    myFs.deleteFile);
  app.post("/renameFile", restrict,    myFs.renameFile);
  app.post("/duplicateFile", restrict, myFs.duplicateFile);

  /**
   * Project routes
   */
  app.get("/allProjectFiles",               restrict, project.allProjectFiles);
  app.post("/launchProject",                restrict, project.launchProject);
  app.get("/allUsersEditingProjectsIFrame", restrict, project.allUsersEditingProjectsIFrame);
  app.get("/allUsersEditingProjects",       restrict, project.allUsersEditingProjects);
};
