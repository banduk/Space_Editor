// IMPORTANT! Getting now variable from window
var now = parent.now;

$(document).ready(function() {

  $("#chatSendButton").click(function(ev){
    ev.preventDefault();
    var message = $("#chat-txtToSend").val();
    if($("#globalChat").is(':visible')){
      now.s_teamMessageBroadcast("personal", message);
    }else{
      var fname = $("#funcChat").attr("fname");
      var funcname = $("#funcChat").attr("funcname");
      if(fname && funcname) now.s_sendFuncChatMessage(fname, funcname, message);
    }
    $("#chat-txtToSend").val("");
  })

  $("#gChat").click(function(ev){
    ev.preventDefault();
    $("#globalChat").toggle();
    $("#globalChatHeader").toggle(function(){
      if($("#globalChatHeader").is(":visible"))
        $("#gChat").css('background-color', '#555');
      else
        $("#gChat").css('background-color', '#222');
    });

  });
});

now.c_addFuncToChatPane = function(fname, funcName){
  if($("#funcChat").attr("fname") != fname && $("#funcChat").attr("funcname") != funcName)
  $("#funcChat").empty();
  $("#funcChat").attr("fname", fname).attr("funcname", funcName);
  $("#topFileName").text(fname + " :: ");
  $("#topFuncName").text(funcName);
}

now.c_receiveFuncChat = function(fname, message, fromUserId, fromUserName, time, fromUserImg){
  var msg = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  $("#funcChat").append(
      "<div class='chat-msg'>"
    +   "<div class='chat-info'>"
    +   "<img class='chat-img' title="+fromUserName+" alt="+fromUserName+" src=" + fromUserImg + "></img>"
    // +     "<span class'chat-time'>"+time+"</span>"
    +   "</div>"
    +   "<div class='chat-txt'>"+message+"</div>"
    +   "<div style='clear:both'></div>"
    + "</div>"
  );
};


now.c_receiveGlobalChatChat = function(message, fromUserId, fromUserName, time, fromUserImg){
  // var userColor = userColorMap[fromUserId%userColorMap.length];
  var msg = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  $("#globalChat").append(
      "<div class='chat-msg'>"
    +   "<div class='chat-info'>"
    +   "<img class='chat-img' title="+fromUserName+" alt="+fromUserName+" src=" + fromUserImg + "></img>"
    // +     "<span class'chat-time'>"+time+"</span>"
    +   "</div>"
    +   "<div class='chat-txt'>"+message+"</div>"
    +   "<div style='clear:both'></div>"
    + "</div>"
  );
};
