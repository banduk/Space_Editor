

/**
 * Documentation stuff (scoped chat ...)
 * @return {}
 */

module.exports = function(){

  // Lets start using the fileGroup
  // List of the users for each function


  var docs = {};


  /**
   * Show the chat for the function in a given line for a give client
   * @param  {object} userObj an object representing the given user
   * @param  {string} fname   the filename of the current file
   * @param  {object} line    the line of the user's cursor
   * @return {}
   */
  this.showFnChat = function(userObj, fname, line){
    myFs.localFileFetch(userObj, fname, function(fname, data, err, isSaved){
      try{
        var parsed = uglJs.parse(data);
        var walker = new uglJs.TreeWalker(function(node){
          if (node instanceof uglJs.AST_Defun) {
            // The cursor(range.start.row) is in a function signature
            // Notice that line starts at 0 and node.start.line at 1
            if((line == node.start.line)){
              nowjs.getClient(userObj.clientId, function(){
                if(this.now === undefined){
                  console.log("Undefined clientId for checkScopeNCreateChat" + userObj.clientId);
                }else{





                  // Lets start using the fileGroup =)
                  // this.addUserToFuncGroup(userObj, fname, node.name.name)
                  this.now.c_addFuncToChatPane(fname, node.name.name);
                  // Stop searching if found
                  return true;
                }
              });
            }
            // If set to false, will check nested functions
            // TODO: find a way to get only the most inner one
            return false;
          }
        });
        parsed.walk(walker);
      } catch(JS_Parse_Error){
        // TODO: find a way to parse the file even when not valid
        console.log("The file is not valid, cannot parse...");
      }
    });
  }
}

// DOC TOOLS
// // teamDoc = docs[this.now.TEAM_ID]  || {};
// // fileDoc = teamDoc[fname]          || {};
// // funcDoc = fileDoc[node.name.name] || {};
// // argsDoc = funcDoc[args]           || {};

// var teamDoc = {};
// var fileDoc = {};
// var funcDoc = {};
// var argsDoc = {};
// var funcChatDoc = {};

// for(arg in node.argnames) {
//   argsDoc[node.argnames[arg].name] = {
//       name : node.argnames[arg].name
//     , type : '[type of ' + node.argnames[arg].name + ']'
//     , descr: '[description of ' + node.argnames[arg].name + ']'
//   }
// }

// funcDoc[node.name.name] = {
//     name : node.name.name
//   , descr: '[description of ' + node.name.name + ']'
//   , args : argsDoc
//   , chats: funcChatDoc
// }

// fileDoc[fname] = {
//     name : fname
//   , descr: '[description of ' + fname + ']'
//   , funcs: funcDoc
// }

// teamDoc[this.now.TEAM_ID] = {
//   name : this.now.TEAM_ID
//   , descr: '[description of ' + this.now.TEAM_ID + ']'
//   , files: fileDoc
// }

// console.warn(JSON.stringify(teamDoc));







  //var usersInFuncGroup = this.usersInFuncGroup = {};
  // this.addUserToFuncGroup = function(userObj, fname, funcName){
  //   // Get the path of the file the user is editting (if theres no path, the user wants the log)
  //   if(fname  && fname !== "" && funcname && funcName !== ""){
  //     var groupname = userObj.TEAM_ID + "/" + fname + "::" + funcName;

  //     // Get the group of users that are in the group of this function
  //     var g = nowjs.getGroup(groupname);

  //     // If the user is not in this group (is not in the scope of this function)
  //     if(!g.users[userObj.clientId]){
  //       // add to NOW group.
  //       g.addUser(userObj.clientId);

  //       // add to local group.
  //       userObj.grouplist.push(groupname);

  //       // keep track locally of users in group.
  //       fg.usersInGroupPlusPlus(groupname);
  //     }
  //   }
  // }

  /**
   * Check if the user cursor is in a given context (for now only 1st lvl simple functions)
   * and in the case positive, tell the client to open a chat for that
   * @param  {object} userObj an object representing the given user
   * @param  {string} fname   the filename of the current file
   * @param  {object} range   the possition (range) of the user's cursor
   * @return {}
   */
  // this.checkScopeNCreateChat = function(userObj, fname, range){
  //   myFs.localFileFetch(userObj, fname, function(fname, data, err, isSaved){
  //     try{
  //       var parsed = uglJs.parse(data);
  //       var walker = new uglJs.TreeWalker(function(node){
  //         if (node instanceof uglJs.AST_Defun) {
  //           // The cursor(range.start.row) is in a function signature
  //           // Notice that range.start.row starts at 0 and node.start.line at 1
  //           if((range.start.row+1 == node.start.line)){

  //             nowjs.getClient(userObj.clientId, function(){
  //               if(this.now === undefined){
  //                 console.log("Undefined clientId for checkScopeNCreateChat" + userObj.clientId);
  //               }else{
  //                 // Lets start using the fileGroup =)
  //                 // this.addUserToFuncGroup(userObj, fname, node.name.name)
  //                 this.now.c_addFuncToChatPane(fname, node.name.name);
  //                 // Stop searching if found
  //                 return true;
  //               }
  //             });
  //           }
  //           // If set to false, will check nested functions
  //           // TODO: find a way to get only the most inner one
  //           return false;
  //         }
  //       });
  //       parsed.walk(walker);
  //     } catch(JS_Parse_Error){
  //       // TODO: find a way to parse the file even when not valid
  //       console.log("The file is not valid, cannot parse...");
  //     }
  //   });
  // }
