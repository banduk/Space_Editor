
// A restricted action is an action that can only be accessed by a logged user
exports.restrict = function(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    //console.log('User is not logged and is not authorized to access ' + req.url + '!');
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

// A unrestricted action is an action that can only be accessed by a not logged user
exports.unrestrict = function(req, res, next) {
  if (req.session.user) {
    //console.log('User is already logged, there\'s no sense on going to ' + req.url + '!');
    req.session.error = 'You are already logged, there\'s no sense on going to ' + req.url + '!';
    res.redirect('/');
  } else {
    next();
  }
}

exports.occurrences = function(string, substring){
  var n=0;
  var pos=0;
  while(true){
    pos=string.indexOf(substring,pos);
    if(pos!=-1){ n++; pos+=substring.length;}
    else{break;}
  }
  return(n);
}
