//for recommendation chat
$(document).ready(function() {
    let socket = io();
    let username = $("#usersname").text();

    //send message when button is pressed
    $("#btnMsg").click( function() {
        let msg = $("#msgInput").val();
        $("#msgInput").val("")
        socket.emit('clientMessage', {
            username: username,
            message: msg
        });
    });

    //print song recommendation from server
    socket.on('outputSong', function(data) {
        let recommendations = $('#reclist');

        $(recommendations).append(`<div class="rectext">
            <span class="has-text-primary">${data.username}
            </span> has recommended <span class="has-text-danger">
            ${data.song}</span></div>`);
    });

    //print message from server
    socket.on('outputMessage', function(data) {
        let recommendations = $('#reclist');

        $(recommendations).append(`<div class="msgtext"><span class="has-text-primary">${data.username}</span>: ${data.message}</div>`);
    });
});