var users       = require('./../model/user');

module.exports = function(){
  this.getByUsername = function(username){
    return users.getByUsername(username);
  };

  this.index = function(req,res,next){
    req.url = "index.html";
    STATIC_PROVIDER(req, res, next);
  };

  /*SIGNUP*/
  this.signup = function(req, res){
    res.render('signup');
  };

  //TODO: Test user name and password
  this.doSignup = function(req, res){
    // get the temporary location of the file
    var tmp_path = req.files.thumbnail.path;

    // Testing file name
    // TODO: test file extensions
    var i = req.files.thumbnail.name.lastIndexOf('.');
    if(i < 0){
      console.error("Cannot find file extension for user image upload.")
      req.session.error = 'Signup failed: error while uploading your picture. Try another one.';
      res.redirect('signup');
    }
    else{
      // set where the file should actually exists - in this case it is in the "images" directory
      var target_path = './public/img/profile/' + req.body.username + req.files.thumbnail.name.substr(i);
      // var target_path = '/tmp/' + req.body.username + req.files.thumbnail.name.substr(i);
      console.log("new name: " + target_path);

      // move the file from the temporary location to the intended location
      fs.rename(tmp_path, target_path, function(err) {
        if (err){
          console.error('Error while renaming file:\n'+err);
          req.session.error = 'Signup failed, error while uploading your picture. Try another one.';
          res.redirect('signup');
          throw err;
        }
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
          if (err) console.error('Error while unlinking temp pictire:\n' + err);
          else{
            var external_path = '/img/profile/' + req.body.username + req.files.thumbnail.name.substr(i);
            usr = users.create(req.body.username, req.body.password, external_path);
            doAuthenticate(req, res, usr);
          }
        });
      });
    }
  };

  /*LOGIN*/
  this.login = function(req, res){
    res.render('login');
  };
  this.doLogin = function(req, res){
    authenticate(req.body.username, req.body.password, function(err, user){
      if (user) {
        // Regenerate session when signing in to prevent fixation
        req.session.regenerate(function(){doAuthenticate(req, res, user)});
      } else {
        req.session.error = 'Authentication failed, please check your '
          + ' username and password.';
        res.redirect('login');
      }
    });
  };

  /*LOGOUT*/
  this.logout = function(req, res){
    // destroy the user's session to log him out
    req.session.destroy(function(){
      res.redirect('/');
    });
  };


  // Authenticate using our plain-object database of doom!
  function authenticate(username, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', username, pass);
    var usr = users.users[username];
    // query the db for the given username
    if (!usr) return fn(new Error('cannot find user'));
    // apply the same algorithm to the POSTed password, applying
    // the hash against the pass / salt, if there is a match we
    // found the user
    auth.hash(pass, usr.salt, function(err, hash){
      if (err) return fn(err);
      if (hash == usr.hash) {
        return fn(null, usr);
      }
      fn(new Error('invalid password'));
    });
  };

  function doAuthenticate(req, res, user){
    // Store the user's primary key
    // in the session store to be retrieved,
    // or in this case the entire user object
    req.session.user = user;
    req.session.success = 'Authenticated as ' + user.username
      + ' click to <a href="/logout">logout</a>.';

      console.log("Authenticated: " + user.username);
      // TODO: remove password =D
      res.redirect("/?project=" + TEAM_ID);
  };
}
