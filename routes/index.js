var rt      = require('./rt');
var actions = require('./action');


exports.route = function() {

  rt.config();
  rt.route();
  actions.route();

};
