

var users = {};
var hash  = require('./../controllers/pass').hash;

exports.users  = users;

exports.list = function(req, res){
  res.send(users);
};

exports.create = function(name, usr, pwd){
  users[usr] = {name: name};
  hash(pwd, function(err, salt, hash){
    if (err) throw err;
    users[usr].salt = salt;
    users[usr].hash = hash;
  });
  return users[usr]
}
