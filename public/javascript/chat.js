// IMPORTANT! Getting now variable from window
var now = parent.now;

$(document).ready(function() {

  $("#chatSendButton").click(function(ev){
    ev.preventDefault();
    var message = $("#chat-txtToSend").val();
    if($("#globalChat").is(':visible')){
      now.s_teamMessageBroadcast("personal", message);
    }else{
      var fname = $(".fileChat:visible:first").attr("file");
      console.log("lets send: ["+fname+"]" + message);
      now.s_sendFileChatMessage(fname, message);
      $("#chat-txtToSend").val("");
      return false;
    }
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

  })

  // FIXME: This is the biggest crap I did in my life! hehehe
  // It would be better to change the cht when a pane is clicked, but i tried without success
  // There is a TODO at editProject about it
  setInterval(function(){
    var pane = $(top.document.activeElement).parents(".editPane");
    if(pane && pane.length > 0){
      var fullFileName = $(pane).children('.editorFrame').attr('src');
      if(fullFileName){
        var regex = /(fname=[a-zA-Z0-9]+\.[a-zA-Z0-9]+)/i;
        var regex2 = /([a-zA-Z0-9]+\.[a-zA-Z0-9]+)/i;
        var fname = fullFileName.match(regex)[0].match(regex2);
        if(fname[0]){
          $(".fileChat").hide();
          $(".fileChat[file='"+fname[0]+"']").show();
          if(!$("#globalChat").is(':visible'))
            $("#topFileName").text(fname[0]);
        }
      }
    }
  },1000);

});

now.c_addFileToChatPane = function(fname){
  $("#fileChats").append("<div class='fileChat' style='display:block' file='"+fname+"'> </div>");
}

now.c_receiveFileChat = function(fname, message, fromUserId, fromUserName, time){
  var msg = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  $(".fileChat[file='"+fname+"']").append(
      "<div class='chat-msg'>"
    +   "<div class='chat-info'>"
    +     "<span class='chat-from'>"+fromUserName+"</span>"
    +     "</br>"
    +     "<span class'chat-time'>"+time+"</span>"
    +   "</div>"
    +   "<div class='chat-txt'>"+message+"</div>"
    + "</div>"
  );
};


now.c_receiveGlobalChatChat = function(message, fromUserId, fromUserName, time){
  // var userColor = userColorMap[fromUserId%userColorMap.length];
  var msg = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  $("#globalChat").append(
      "<div class='chat-msg'>"
    +   "<div class='chat-info'>"
    +     "<span class='chat-from'>"+fromUserName+"</span>"
    +     "</br>"
    +     "<span class'chat-time'>"+time+"</span>"
    +   "</div>"
    +   "<div class='chat-txt'>"+message+"</div>"
    + "</div>"
  );
};
