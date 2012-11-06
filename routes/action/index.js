var user = require('./user')
  , file = require('./file')
  , project = require('./project')
  ;


this.route = function() {
  user.route();
  file.route();
  project.route();
};
