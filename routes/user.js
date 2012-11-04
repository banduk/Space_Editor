
var users       = require('./../models/user'),
    hash        = require('./pass').hash,
    restrict    = require('./../controllers/util').restrict,
    unrestrict  = require('./../controllers/util').unrestrict;


// Authenticate using our plain-object database of doom!
function authenticate(name, pass, fn) {
  if (!module.parent) console.log('authenticating %s:%s', name, pass);
  var usr = users.users[name];
  // query the db for the given username
  if (!usr) return fn(new Error('cannot find user'));
  // apply the same algorithm to the POSTed password, applying
  // the hash against the pass / salt, if there is a match we
  // found the user
  hash(pass, usr.salt, function(err, hash){
    if (err) return fn(err);
    if (hash == usr.hash) {
      return fn(null, usr);
    }
    fn(new Error('invalid password'));
  });
}


app.get('/', restrict, function(req,res,next){
  req.url = "index.html";
  staticProvider(req, res, next);
});

/*List users*/
app.get('/users', users.list);

/*SIGNUP*/
app.get('/signup', unrestrict, function(req, res){
  res.render('signup');
});
app.post('/signup', function(req, res){
  usr = users.create(req.body.name, req.body.username, req.body.password);
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
        + ' username and password.'
        + ' (use "tj" and "foobar")';
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
  req.session.success = 'Authenticated as ' + user.name
    + ' click to <a href="/logout">logout</a>. '
    + ' You may now access <a href="/restricted">/restricted</a>.';

    console.log("Authenticated: " + user.name);
    // TODO: remove password =D
    res.cookie("_username", user.name);
    res.redirect("/?project=project1");
}
