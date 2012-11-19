var User = require('./../model/user');

module.exports = function(){
  var getByEmail = this.getByEmail = function(email, callback){
    var unescapedMail = unescape(email);
    User.find({email: unescapedMail}, function (err, ids) {
      if (ids.length === 0) callback(false);
      User.load(ids[0], function (err) {
        if (err) callback(false);
        callback(this.profileProperties());
      });
    });
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
      var imgHash = crypto.createHash("md5").update(req.body.email).digest("hex");
      // set where the file should actually exists - in this case it is in the "images" directory
      var target_path = './public/img/profile/' + imgHash + req.files.thumbnail.name.substr(i);

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
            var external_path = '/img/profile/' + imgHash + req.files.thumbnail.name.substr(i);
            var data = {
              name      : req.body.name,
              password  : req.body.password,
              email     : req.body.email,
              picture   : external_path
            };
            var user = Nohm.factory('User');
            user.store(data, function (err) {
              if (err) {
                req.session.error = 'Signup failed.';
                res.render('signup');
              }
            });

            // usr = user.create(req.body.email, req.body.name, req.body.password, external_path);
            doAuthenticate(req, res, user.profileProperties());
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
    authenticate(req.body.email, req.body.password, function(err, user){
      if (user) {
        // Regenerate session when signing in to prevent fixation
        req.session.regenerate(function(){doAuthenticate(req, res, user)});
      } else {
        req.session.error = 'Authentication failed, please check your '
          + ' email and password.';
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
  function authenticate(email, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', email, pass);

    var user = Nohm.factory('User');
    user.login(email, pass, function(err, u){
      if(err) return fn(err);
      else return fn(null, u);
    });
  }

  function doAuthenticate(req, res, user){
    // Store the user's primary key
    // in the session store to be retrieved,
    // or in this case the entire user object
    req.session.user = user;

    req.session.success = 'Authenticated as ' + user.email ;

    console.log("Authenticated: " + req.session.user.email);
    res.redirect("/?project=" + TEAM_ID);
  };
}
