var users = exports.users  = {};

exports.create = function(name, usr, pwd){
  users[usr] = {name: name};
  auth.hash(pwd, function(err, salt, hash){
    if (err) throw err;
    users[usr].salt = salt;
    users[usr].hash = hash;
  });
  return users[usr]
}
