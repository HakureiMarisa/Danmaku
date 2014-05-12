    "use strict";

    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('form input');

    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;
    var connection = null;
    var currentToUser = null;
    connect();

    /**
     * Send mesage when user presses Enter key
     */
    $('form').submit(function(){
        var msg = input.val();
        if (!msg) {
            return false;
        }
        var time = new Date();
        var tmpTime = time.getFullYear() + "-" + ((time.getMonth() < 9 ? "0" : "") + (time.getMonth() + 1)) + "-" + ((time.getDate() < 10 ? "0" : "") + time.getDate()) + " "
                + ((time.getHours() < 10 ? "0" : "") + time.getHours()) + ":" + ((time.getMinutes() < 10 ? "0" : "") + time.getMinutes()) + ":" + ((time.getSeconds() < 10 ? "0" : "") + time.getSeconds());
        // send the message as an ordinary text
        msg = { username: myName, msg: input.val(), time:tmpTime};
        
        //alert(typeof(object));
        connection.json.send(msg);
        input.val('');
        return false;
    });
    
function connect() {
    // open connection
    connection = io.connect('http://127.0.0.1:8080', { 'reconnect': false });

    connection.on("error", function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', {
            text: 'Sorry, but there\'s some problem with your '
                + 'connection or the server is down.'
        }));
    });

    // most important part - incoming messages
    connection.on("message", function (message) {
        addMessage(message);
    });
}

function addMessage(message){
    var m_class="message";
    console.log(message);console.log(connection);
    if (message.sender == connection.socket.sessionid) {
        m_class += ' sender';
    }
    var html = '<div class="'+m_class+'"> \
    <span class="msg">'+message.msg+'</span><span class="time">'+message.time+'</span>\
    </div>';
    content.append(html);
    $("#content .message:hidden").each(function(){
        var randomTop = Math.floor(Math.random() * 83) +4;
        if ((randomTop < 55) && (randomTop >30) )
        {
            if (randomTop <43.5) { randomTop = randomTop - 13; }
            else {randomTop = randomTop + 12;}
        }
        var randomTopStr = randomTop + "%";
        $(this).css({top: randomTopStr, display: 'block'});
        $(this).animate({left: "-100%"}, 10000, 'linear', function(){
            console.log("dd");
        });
    });
}