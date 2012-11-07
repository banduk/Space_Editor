var users       = require('./../model/user');

module.exports = function(){
  this.getByUsername = function(username){
    return users.getByUsername(username);
  }
}
