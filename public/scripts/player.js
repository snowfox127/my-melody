let currentsong = 0;
let songslist = [];
let imglist = [];
let titlelist = [];
let rotang = 0;
var circle;
var defs;
var svgCont;
var globali = 0;

$(document).ready(async function() {
    //create svg box
    svgCont = d3.select("#visual").append("svg").attr("width", 200).attr("height", 200);
    defs = svgCont.append('defs');

    //get list of songs in playlist
    let songblocks = $(".song");
    
    //go through all song ids and extract info
    for (i = 0; i < songblocks.length; i ++) {
        let x = $(songblocks[i]).attr('id');
        
        await dataList(x).then(function(data) {
            //push data into lists
            songslist.push(x);
            titlelist.push(data[1][0]);
            imglist.push(data[3][0]);
            $(".allsongs").children().eq(globali).children(".songtitle").text(data[1][0]);

            //add new disc pattern using youtube thumbnail
            defs.append("pattern")
                .attr("id", `vsvs${globali}`)
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("patternContentUnits", "objectBoundingBox")
                .append("image")
                .attr("xlink:href", `${data[3][0]}`)
                .attr("width", 2)
                .attr("height", 2)
                .attr("x",-0.5)
                .attr("y",-0.5);

            globali += 1;
        });
    }
});

//set up youtube api
var tag = document.createElement('script');
tag.src = "//www.youtube.com/player_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var player;

function onYouTubePlayerAPIReady() {
    player = new YT.Player('video', {
        events: {
            'onReady': playerReady,
            'onStateChange': stateChange
        }
    });
}

function playerReady(event) {
    //add svg data
    var lingrad = defs.append("radialGradient")
        .attr("id","divgrad")
        .attr("x1","0%")
        .attr("y1","0%")
        .attr("x2","100%")
        .attr("y2","0%");

    lingrad.append("stop")
        .attr("offset","0%")
        .attr("stop-color","red")
        .attr("stop-opacity","1");

    lingrad.append("stop")
        .attr("offset","50%")
        .attr("stop-color","blue")
        .attr("stop-opacity","1");

    lingrad.append("stop")
        .attr("offset","100%")
        .attr("stop-color","green")
        .attr("stop-opacity","1");

    circle = svgCont.append("circle")
        .attr("id","disc")
        .attr("cx",100)
        .attr("cy",100)
        .attr("r",100)
        .style("fill","black");

    var circle2 = svgCont.append("circle")
        .attr("cx",100)
        .attr("cy",100)
        .attr("r",20)
        .style("fill","#bd4037");

    var circle3 = svgCont.append("circle")
        .attr("cx",100)
        .attr("cy",100)
        .attr("r",8)
        .style("fill","black");


    //cue first vid in playlist
    player.cueVideoById(songslist[0], 0, "large");

    //general play button
    $("#btnplay").click(function() {
            circle.style("fill",`url(#vsvs${currentsong})`);
            player.playVideo();
        }
    );
    
    //repeatedly update progress bar and disc spinning
    setInterval(updateBar,30);

    //individual song play button
    $(".btnsongplay").click(function() {
            let x = $(this).parents().index();
            player.loadVideoById(songslist[x], 0, "large");
            currentsong = x;
            circle.style("fill",`url(#vsvs${currentsong})`);
    });

    //output socket recommendation
    let socket = io();
    let username = $("#usersname").text();
    $(".btnRecommend").click(function() {
        let songtitle = $(this).siblings(".songtitle").text();
        console.log("push" + songtitle);
        socket.emit('clientSong', {
            username: username,
            song: songtitle
        });
    });


    //general pause button
    $("#btnpause").click(function() {
            player.pauseVideo();
    });

    //general previous button
    $("#btnprev").click(function() {
            prevsong();
            circle.style("fill",`url(#vsvs${currentsong})`);
            player.loadVideoById(songslist[currentsong], 0, "large");
    });

    //general next button
    $("#btnnext").click(function() {
            nextsong();
            circle.style("fill",`url(#vsvs${currentsong})`);
            console.log(circle.style("fill"));
            player.loadVideoById(songslist[currentsong], 0, "large");
    }); 
}

//function to get next song index and repeat through numbers
function nextsong() {
    currentsong += 1;

    if (currentsong > songslist.length-1) {
        currentsong = 0;
    }
}
//function to get previous song index and repeat through numbers
function prevsong() {
    currentsong -= 1;

    if (currentsong < 0) {
        currentsong = songslist.length-1;
    }
}

//play next song when song is over
function stateChange(event){
    if (event.data === 0) {
        nextsong();
        player.loadVideoById(songslist[currentsong], 0, "large");
    }
}

//update spinning disc and progress bar
function updateBar() {
    let songbar = $("#songbar");
    let maxtime = player.getDuration();
    let curtime = player.getCurrentTime();

    rotang = (curtime * 4) % 360;
    circle.attr("transform",`rotate(${rotang},100,100)`);

    $(songbar).attr("max",maxtime).attr("value",curtime);
}