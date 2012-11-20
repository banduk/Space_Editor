var Func     = require('./../model/doc/functionDocModel');
var FuncChat = require('./../model/doc/functionChatDocModel');
var File     = require('./../model/doc/fileDocModel');
var Proj     = require('./../model/doc/projectDocModel');

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
            if((line == node.start.line)){
              nowjs.getClient(userObj.clientId, function(){
                var self = this;
                if(self.now === undefined){
                  console.log("Undefined clientId for checkScopeNCreateChat" + userObj.clientId);
                }else{
                  getFuncDoc(userObj.TEAM_ID, fname, node, function(doc){
                    if(!doc){
                      //create doc and send to user
                      createFuncDoc(userObj.TEAM_ID, fname, node.name.name, function(doc){
                        self.now.c_addFuncToChatPane(fname, node.name.name, doc, {});
                      });
                    }else{
                      //send doc to user
                      getChatsByFunction(userObj.TEAM_ID, fname, node.name.name, function(chats){
                        self.now.c_addFuncToChatPane(fname, node.name.name, doc, chats);
                      });
                    }
                  });
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

  var getFuncDoc = function(team, fname, node, callback){
    var funcFullName = team+"/"+fname+"::"+node.name.name;
    var func = Nohm.factory('Function');
    func.findByName(funcFullName, function(err, funcDoc){
      if(err){
        console.error(err);
        callback(false);
      }
      else{
        callback(funcDoc.cleanData());
      }
    });
  }

  var createFuncDoc = function(team, fname, funcname, callback){
    var funcFullName = team+"/"+fname+"::"+funcname;
    var func = Nohm.factory('Function');
    var data = {
      name        : funcFullName,
      description : fname,
      params      : {}
    }
    func.create(data, function(err, doc){
      if(err) console.error(err);
      else callback(doc.cleanData());
    });
  }

  var getChatsByFunction = function(team, fname, funcname, callback){
    var funcFullName = team+"/"+fname+"::"+funcname;

    var func = Nohm.factory('Function');
    func.findByName(funcFullName, function(err, funcDoc){
      if(err) console.log(err);
      else{
        funcDoc.getAll('FuncChat', 'hasChat', function (err, chatIds) {
          console.log(chatIds.length);
          if(err) console.error(err);
          else{
            if(chatIds.length === 0) callback([]);
            else{
              // FuncChat.sort({field: 'date'}, chatIds, function(err, sorted_ids){
                var chats = [];
                var count = 0;
                var len = chatIds.length;
                chatIds.forEach(function (id) {
                  var chat = Nohm.factory('FuncChat');
                  chat.load(id, function (err, props) {
                    if (!err) chats.push(chat.fullProps());
                    if (++count === len) callback(chats);
                  });
                });
              // });
            }
          }
        });
      }
    });
  }

  this.addChatToFunction = function(team, fname, funcName, message, email, date){
    var funcFullName = team+"/"+fname+"::"+funcName;
    var func = Nohm.factory('Function');
    var data = {
      funct     : funcFullName,
      user      : email,
      message   : message,
      date      : date
    }
    func.addChat(data, function(err, chat){
      if(err) console.log(err);
      else  console.log("added a chat from " + email + " to the docs");
    });
  }
}
