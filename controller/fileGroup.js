/**
 * Filegroup functions
 * @return {}
 */
module.exports = function(){
  // List of the users for each file
  var usersInGroup = this.usersInGroup = {};

  /**
   * Add a given user to a given the filegroup
   * @param {Javascript Object} userObj A object representing the user
   * @param {string} fname              The filename
   * @return {}
   */
  this.addUserToFileGroup = function(userObj, fname){
    // Get the group of the user
    var groupname = userObj.TEAM_ID;

    // Get the path of the file the user is editting (if theres no path, the user wants the log)
    if(fname  && fname !== "")
      groupname += "/" + fname;

    // Get the group of users that are in the group of this file
    var g = nowjs.getGroup(groupname);

    // If the user is not in this group yet (does not have this file opened)
    if(!g.users[userObj.clientId]){
      // add to NOW group.
      g.addUser(userObj.clientId);

      // add to local group.
      userObj.grouplist.push(groupname);

      // keep track locally of users in group.
      this.usersInGroupPlusPlus(groupname);

      if(fname.length > 0){
        //Tell to the people that have the file opened that this user entered
        var teamgroup = nowjs.getGroup(userObj.TEAM_ID);
        teamgroup.now.c_processUserFileEvent(fname, "joinFile", userObj.clientId, usersInGroup[groupname]);

        // Add this file to the user's chat
        nowjs.getClient(userObj.clientId, function(){
          if(this.now === undefined){
            console.log("Undefined clientId for adding chat pane >> " + id);
          }else{
            this.now.c_addFileToChatPane(fname);
          }
        });
      }
    }else{
      console.log("no need to add user " + userObj.clientId + " to group: " + groupname + " ???");
    }
  }

  /**
   * Remove a given user from a given filegroup
   * @param {Javascript Object} userObj A object representing the user
   * @param {string} fname              The filename
   * @return {}
   */
  this.removeUserFromFileGroup = function(userObj, fname){
    // Get the group of the user
    var groupname = userObj.TEAM_ID;

    // Get the path of the file the user is editting (if theres no path, the user wants the log)
    if(fname  && fname !== "")
      groupname += "/" + fname;

    // Get the group of users that are in the group of this file
    var g = nowjs.getGroup(groupname);

    // TODO: And if the user has the file oppened more then once
    // If the user is in this group (has this file opened)
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
        var teamgroup = nowjs.getGroup(userObj.TEAM_ID);
        teamgroup.now.c_processUserFileEvent(fname, "leaveFile", userObj.clientId, usersInGroup[groupname]);

        // Remove this file from the user's chat
        nowjs.getClient(userObj.clientId, function(){
          if(this.now === undefined){
            console.log("Undefined clientId for removing chat pane >> " + id);
          }else{
            this.now.c_removeFileFromChatPane(fname);
          }
        });
      }



      //console.log("Removed user " + userObj.clientId + " from: " + groupname);
    }else{
      console.log("no need to remove user " + userObj.clientId + " from group: " + groupname + " ???");
    }
  }

  /**
   * Increment the number of users in the given group
   * @param  {string} group The name of the group
   * @return {}
   */
  this.usersInGroupPlusPlus = function(group){
    if(usersInGroup[group]){
      usersInGroup[group]++;
    }else{
      usersInGroup[group] = 1;
    }
    //console.log("UsersInGroup(+): " + group + " >> " + usersInGroup[group]);
  }

  /**
   * Decrement the number of users in the given group
   * @param  {string} group The name of the group
   * @return {}
   */
  this.usersInGroupMinusMinus = function(group){
    if(usersInGroup[group]){
      usersInGroup[group]--;
    }else{
      usersInGroup[group] = 0;
    }
    //console.log("UsersInGroup(-): " + group + " >> " + usersInGroup[group]);
  }
}
