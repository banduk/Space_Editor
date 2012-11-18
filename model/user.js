var users = exports.users  = {};

exports.create = function(usr, pwd, imgPath){
  users[usr] = {
    username: usr,
    picture : imgPath
  };

  auth.hash(pwd, function(err, salt, hash){
    if (err) throw err;
    users[usr].salt = salt;
    users[usr].hash = hash;
  });

  return users[usr];
}

exports.getByUsername = function(usr){
  return users[usr];
}
