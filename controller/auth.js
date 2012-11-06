

module.exports = function() {
// A restricted action is an action that can only be accessed by a logged user
  this.restrict = function(req, res, next) {
      if (req.session.user) {
        next();
      } else {
        //console.log('User is not logged and is not authorized to access ' + req.url + '!');
        req.session.error = 'Access denied!';
        res.redirect('/login');
      }
  }

  // A unrestricted action is an action that can only be accessed by a not logged user
  this.unrestrict = function(req, res, next) {
    if (req.session.user) {
      //console.log('User is already logged, there\'s no sense on going to ' + req.url + '!');
      req.session.error = 'You are already logged, there\'s no sense on going to ' + req.url + '!';
      res.redirect('/');
    } else {
      next();
    }
  }




  var crypto = this. crypto = require('crypto');
  var len = this.len =  128;
  var iterations = this.iterations = 12000;

  /**
   * Hashes a password with optional `salt`, otherwise
   * generate a salt for `pass` and invoke `fn(err, salt, hash)`.
   *
   * @param {String} password to hash
   * @param {String} optional salt
   * @param {Function} callback
   * @api public
   */
  this.hash = function (pwd, salt, fn) {
    if (3 == arguments.length) {
      crypto.pbkdf2(pwd, salt, iterations, len, fn);
    } else {
      fn = salt;
      crypto.randomBytes(len, function(err, salt){
        if (err) return fn(err);
        salt = salt.toString('base64');
        crypto.pbkdf2(pwd, salt, iterations, len, function(err, hash){
          if (err) return fn(err);
          fn(null, salt, hash);
        });
      });
    }
  };
}
