
/*var usersInGroup = {};*/
var usersInGroup = exports.usersInGroup = {};

exports.addUserToFileGroup = function(userObj, fname){
  var groupname = userObj.teamID;
  if(fname  && fname !== ""){
    groupname += "/" + fname;
  }
  //console.log("ADD TO GROUP: " + groupname);
  //console.log("        team: " + userObj.teamID);
  //console.log("       fname: " + fname);
  var g = nowjs.getGroup(groupname);
  if(!g.users[userObj.clientId]){
    // user not in group yet.
    // add to NOW group.
    g.addUser(userObj.clientId);
    // add to local group.
    userObj.grouplist.push(groupname);
    // keep track locally of users in group.
    usersInGroupPlusPlus(groupname);
    if(fname.length > 0){
      var teamgroup = nowjs.getGroup(userObj.teamID);
      teamgroup.now.c_processUserFileEvent(fname, "joinFile", userObj.clientId, usersInGroup[groupname]);
    }
    //console.log("Added user " + user + " to group: " + group);
  }else{
    console.log("no need to add user " + userObj.clientId + " to group: " + groupname + " ???");
    //console.log(g.users[userObj.clientId]);
  }
}
exports.removeUserFromFileGroup = function(userObj, fname){
  var groupname = userObj.teamID;
  if(fname  && fname !== ""){
    groupname += "/" + fname;
  }
  var g = nowjs.getGroup(groupname);
  if(g.users[userObj.clientId]){
    // user was in group.
    // remove user from NOW group.
    g.removeUser(userObj.clientId);
    // remove user from local group.
    for(var i=userObj.grouplist.length; i>=0; i--){
      if(userObj.grouplist[i] == groupname){
        userObj.grouplist.splice(i, 1);
      }
    }
    // keep track locally of users in group.
    usersInGroupMinusMinus(groupname);
    if(fname.length > 0){
      var teamgroup = nowjs.getGroup(userObj.teamID);
      teamgroup.now.c_processUserFileEvent(fname, "leaveFile", userObj.clientId, usersInGroup[groupname]);
    }
    //console.log("Removed user " + userObj.clientId + " from: " + groupname);
  }else{
    //console.log(g);
    //console.log("no need to remove user " + userObj.clientId + " from group: " + groupname + " ???");
  }
}
exports.usersInGroupPlusPlus = function(group){
  if(usersInGroup[group]){
    usersInGroup[group]++;
  }else{
    usersInGroup[group] = 1;
  }
  //console.log("UsersInGroup(+): " + group + " >> " + usersInGroup[group]);
}
exports.usersInGroupMinusMinus = function(group){
  if(usersInGroup[group]){
    usersInGroup[group]--;
  }else{
    usersInGroup[group] = 0;
  }
  //console.log("UsersInGroup(-): " + group + " >> " + usersInGroup[group]);
}