//song search js
$(document).ready(function() {
    $('#searchButton').click(function() {
        //take query from input
        let query = $('#query').val();
        //call function to get youtube json
        dataList(query).then(function(data){
            console.log(data);
            $("#listview").children().remove();
            let playlistname = $("#playname").text();

            //display all results
            for (i = 0; i < data[0].length; i++) {
                let block = $(`<div class="resultblock 
                    block has-background-primary"></div>`);

                let title = $(`<div class="title">${data[1][i]}</div>`);
                let video = $(`<iframe class="searchvideo" width="300" 
                    height="300" src="//www.youtube.com/embed/${data[0][i]}" 
                    frameborder="0">`);

                let channel = $(`<div class="channelname">${data[2][i]}</div>`);
                let add = $(`<a class="btnaddsong button" 
                    href="/addsong/${playlistname}/${data[0][i]}">
                    Add Song to Playlist</a>`);

                $(block).append(title,video,channel,add);
                $("#listview").append(block);
            }
        });
    });
});