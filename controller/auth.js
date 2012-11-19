/**
 * Authorisation functions
 * @return {}
 */
module.exports = function() {

  /**
   *  A restricted action is an action that can only be accessed by a logged user
   * @param  {ClientRequest} req The request from the client
   * @param  {ServerResponse} res The response to the client
   * @param  {Function} next The action requested
   * @return {}
   */
  this.restrict = function(req, res, next) {
      // If there is user data in the session for the current client accept the action
      if (req.session.user) {
        next();
      }
      // Otherwise deny the access and redirect him to the login page
      else {
        req.session.error = 'Access denied!'; // Setting error session data
        res.redirect('/login');
      }
  }

  /**
   *
   */
  /**
   * An unrestricted action is an action that can only be accessed by a not logged user
   * @param  {ClientRequest} req The request from the client
   * @param  {ServerResponse} res The response to the client
   * @param  {Function} next The action requested
   * @return {}
   */
  this.unrestrict = function(req, res, next) {
    // If there is user data in the session for the current client there's no sense on accessing this page
    if (req.session.user) {
      // Setting error session data
      req.session.error = 'You are already logged, there\'s no sense on going to ' + req.url + '!';
      res.redirect('/');
    }
    // Otherwise accept access
    else {
      next();
    }
  }
}
