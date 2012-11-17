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
  this.doSignup = function(req, res){
    usr = users.create(req.body.username, req.body.password);
    doAuthenticate(req, res, usr);
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
