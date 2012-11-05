/*

$(document).ready(function(){
  // Send message to people in the same group
  $("#send-button").click(function(){
    now.distributeMessage($("#text-input").val());
    $("#text-input").val("");
  });

  // On change of drop down, clear text and change server room
  $('#server-room').change(function(){
    $("#messages").html('');
    now.changeRoom($('#server-room').val());
  });

});

now.c_receiveFileChat = function(fname, message, fromUserId, fromUserName){
  console.log("file chat from " + fromUserId + " in " + fname)
  console.log("     message: " + message);
  var userColor = userColorMap[fromUserId%userColorMap.length];
  var msg = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  jQuery('#'+fname+".messages").append("<br>" + fromUserName + ": " + msg);
}

now.c_addFileToChat = function(fname){
  console.log("file chat from " + fromUserId + " in " + fname)
  console.log("     message: " + message);
  var numb = $(".paneScreenSelected").parents('.editPane:first')[0].attr('id');
  alert(numb);
  /*jQuery("chat-"+pane)
  <div class='msg-hist'>
          banduk: oi </br>
          islene: oi!
        </div>*/
}
*/
