var users       = require('./../../model/user');

exports.route = function(){
  var restrict   = auth.restrict
    , unrestrict = auth.unrestrict
    ;

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
  }


  app.get('/', restrict, function(req,res,next){

    //STATIC_PROVIDER(req, res, next);
    res.render('index');
  });

  /*SIGNUP*/
  app.get('/signup', unrestrict, function(req, res){
    res.render('signup');
  });
  app.post('/signup', function(req, res){
    usr = users.create(req.body.username, req.body.password);
    doAuthenticate(req, res, usr);
  });

  /*LOGIN*/
  app.get('/login', unrestrict, function(req, res){
    res.render('login');
  });
  app.post('/login', function(req, res){
    authenticate(req.body.username, req.body.password, function(err, user){
      if (user) {
        // Regenerate session when signing in
        // to prevent fixation
        req.session.regenerate(function(){doAuthenticate(req, res, user)});
      } else {
        req.session.error = 'Authentication failed, please check your '
          + ' username and password.';
        res.redirect('login');
      }
    });
  });

  /*LOGOUT*/
  app.get('/logout', function(req, res){
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function(){
      res.redirect('/');
    });
  });


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
  }
}
