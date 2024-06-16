let jquery = require('jquery');
let express = require('express');
let app = express();
let http = require('http').createServer(app);
let session = require('express-session');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let bcrypt = require('bcryptjs');
let uuid = require('uuid/v4');
let cor = require('cors');
let io = require('socket.io').listen(http);

//setup mongoose
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/Project', { 
    useNewUrlParser: true,
    useUnifiedTopology: true 
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cor());

//setup session
app.use(session({
    genid: function (request) { return uuid(); },
    resave: false, 
    saveUninitialized: false,
    secret: 'RandyBestProf'
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

let Schema = mongoose.Schema;

//Creates the user structure 
let userSchema = new Schema({
    name: String,
    password: String
}, {collection: 'users'});

let User = mongoose.model('user', userSchema);

//Creates the playlist structure 
let playlistSchema = new Schema({
    title: String,
    user: String,
    songs: [String]
}, {collection: 'playlists'});

let Playlist = mongoose.model('playlist', playlistSchema);

async function addUser(username, password) {
    /* Adds a user to the database: Input is a 
    username as a string and a password as a string */
    let hash = await bcrypt.hash(password, 10);

    let newUser = new User({
        name: username,
        password: hash
    });

    newUser.save(function(error) {
        if (error) {
            console.log(error);
        } else {
            console.log("Added user");
        }
    });
}

async function addPlaylist(title, username, songs) {
    /* Adds a playlist to the database: Input is a 
    title as a string, a username as a string, and 
    an list of the songs in the playlist */
    let newPlaylist = new Playlist({
        title: title,
        user: username,
        songs: songs
    });

    newPlaylist.save(function(error) {
        if (error) {
            console.log(error);
        } else {
            console.log("Added playlist");
        }
    });
}

async function findUser(username) {
    /* Returns the user data: Input is a 
    username as a string */
    let results = await User.find( {name: username} );

    if (results.length > 0) {   
        return(results[0]);
    } else {
        console.log("User not found");
        return(null);
    }
}

async function deleteUser(username) {
    /* Deletes the user data: Input is a 
    username as a string */
    let user = await User.find( {name: username} );

    if (user) {
        User.deleteOne({name: username}, function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log("Deleted user");
            }
        });

        Playlist.deleteMany({user: username}, function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log("Deleted users playlists");
            }
        });
    }
}

async function updateUsername(username, newUsername) {
    /* Updates the username of a user: Input is a 
    username as a string and the new username as 
    a string */
    let user = await findUser(username);
    
    if (user) {
        user.name = newUsername;

        user.save(function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log("Updated user");
            }
        });
    } 
}

async function updatePassword(username, newPassword) {
    /* Updates the password of a user: Input is a 
    username as a string and the new password as 
    a string */
    let user = await findUser(username);
    
    if (user) {
        user.password = await bcrypt.hash(newPassword, 10);

        user.save(function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log("Updated user");
            }
        });
    } 
}

async function findPlaylistUser(username) {
    /* Returns all playlists created by a user:
    Input is a username as a string */
    let results = await Playlist.find( {user: username} );

    if (results.length > 0) {   
        return(results);
    } else {
        console.log("User has no playlists");
        return(null)
    }
}

async function findPlaylistTitle(title) {
    /* Returns all playlists with the corresponding 
    title: Input is a title as a string */
    let results = await Playlist.find( {title: title} );

    if (results.length > 0) {   
        return(results);
    } else {
        console.log("No playlists with that title");
        return(null);
    }
}

async function findPlaylistUserTitle(username, title) {
    /* Returns the playlist created by a user with
    the corresponding title: Input is a username as 
    a string and a title as a string */
    let results = await Playlist.find( {user: username, title: title} );

    if (results.length > 0) {   
        return(results[0]);
    } else {
        console.log("User has no playlist with that title\n");
        return(null);
    }
}

async function deletePlaylist(username, title) {
    /* Deletes the playlist created by a user with
    the corresponding title: Input is a username as 
    a string and a title as a string */
    let playlist = await findPlaylistUserTitle(username, title);
    console.log(playlist._id);
    
    if (playlist) {
        await Playlist.deleteOne({user: username, title: title}, function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log("Deleted playlist");
            }
        });
    }
}

async function updateTitle(username, title, newTitle) {
    /* Updates the title of the playlist created by a 
    user with the corresponding title: Input is a 
    username as a string, a title as a string, and the
    new title as a string */
    let playlist = await findPlaylistUserTitle(username, title);
    
    if (playlist) {
        playlist.title = newTitle;

        playlist.save(function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log("Updated playlist");
            }
        });
    } 
}

async function addSong(username, title, newSong) {
    /* Adds a song the playlist created by a user 
    with the corresponding title: Input is a 
    username as a string, a title as a string, and
    the new song as a string */
    let playlist = await findPlaylistUserTitle(username, title);
    
    if (playlist) {
        playlist.songs.push(newSong);

        playlist.save(function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log("Updated playlist");
            }
        });
    } 
}

async function removeSong(username, title, song) {
    /* Removes a song the playlist created by a 
    user with the corresponding title: Input is a 
    username as a string, a title as a string, and
    the song as a string */
    let playlist = await findPlaylistUserTitle(username, title);
    
    if (playlist) {
        let index = playlist.songs.indexOf(song);

        if (index != -1) {
            playlist.songs.splice(index, 1);

            playlist.save(function(error) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("Updated playlist");
                }
            });
        }
    } 
} 

async function checkUser(username, password) {
    /* Returns true if the login info matches and false
    if it does not: Input is a username as a string and
    a password as a string */
    let hash = await findUser(username);

    if (!hash) {
        return(null);
    }

    //Checks if the password matches the hashed password
    let result = await bcrypt.compare(password, hash.password);

    return(result);
}

//Populates the user database 
async function populateUsers() {
    let usernameL = ['Raph', 'Saya', 'Hayden'];

    let passwordL = ['1234', '4321', '3412'];

    for (let i = 0; i < usernameL.length; i += 1) {
        addUser(usernameL[i], passwordL[i]);
    } 
}

//Populates the playlist database
async function populatePlaylists() {
    var titleL = ['mixtape 1', 'mixtape 2', 'mixtape 3', 'test'];

    var usernameL = ['Raph', 'Saya', 'Saya', 'Raph'];

    var playlistL = [['LHsVtH0CS7I', '02FXTV470Yg', '61tvNgljZ-4'], ['OF_vIU6Y6io', 'XwFpMNtjh58'], ['RUkDxXHjRs8'], ['OF_vIU6Y6io']];

    for (let i = 0; i < titleL.length; i += 1) {
        addPlaylist(titleL[i], usernameL[i], playlistL[i]);
    }
}

//Calls the populate functions if there are no users
User.countDocuments(function (error, count) {
    if (!error && count == 0) {
        populateUsers();
        populatePlaylists();
    }
});

/*
//Tests the functions
async function tests() {
    console.log("1" + JSON.stringify(await findUser("Raph"))+"\n\n");

    console.log("1" + JSON.stringify(await findPlaylistTitle("mixtape 2"))+"\n\n");

    console.log("1" + JSON.stringify(await findPlaylistUser("Saya"))+"\n\n");

    console.log("1" + JSON.stringify(await findPlaylistUserTitle("Saya", "mixtape 3"))+"\n\n");

    console.log("1" + await checkUser("Raph", "1234")+"\n\n");

    console.log("1" + await updateUsername("Hayden", "NotHayden")+"\n\n");

    updateTitle("Saya", "mixtape 3", "not mixtape 3");

    addSong("Raph", "mixtape 1", "Song 4");

    removeSong("Raph", "mixtape 1", "Song 4");

    addUser("NewGuy", "6969");

    deleteUser("NewGuy");

    addPlaylist("NewMixtape", "Raph", ["Song 1", "Song 2"]);

    deletePlaylist("Raph", "NewMixtape");

    deleteUser("Hayden");
}
tests();
//*/

let recommendation = [];
let msgs = [];

//Socket IO recommendations/chat
io.on('connection', function(socket) {
    //output all recommendations to new client
    for (let i = 0; i < recommendation.length; i++) {
        socket.emit('outputSong', recommendation[i]);
    }
    //output all messages to new client
    for (let i = 0; i < msgs.length; i++) {
        socket.emit('outputMessage', msgs[i]);
    }

    socket.on('disconnect', function() {
        console.log('User disconnected');
    });

    //on client song input return client song recommendation to all sockets
    socket.on('clientSong', function(data) {
        if (data) {
            recommendation.push(data);

            if (recommendation.length >= 10) {
                recommendation.shift();
            }
            io.emit('outputSong', data);
        }
    });
    //on client message input return client message to all sockets
    socket.on('clientMessage', function(data) {
        if (data){
            msgs.push(data);

            if (msgs.length >= 10) {
                msgs.shift();
            }
            io.emit('outputMessage', data);
        }
    });
});

//Main page index
app.get('/', async function(request, response) {
    if (request.session.username) {
        let username = request.session.username;
        let outp = await findPlaylistUser(username);

        response.render('index', {
            title: 'Index',
            username: username
        });
    } else {
        response.redirect('/login');
    }
});

//Logout page
app.get('/logout', async function(request, response) {
    request.session.username = '';
    response.redirect('/login');
});

//Login page
app.get('/login', async function(request, response) {
    response.render('login', {
        title: 'Login'
    });
});

//New playlist page
app.get('/newplaylist', async function(request, response) {
    if (request.session.username) {
        response.render('newplaylist', {
            title: 'Add New Playlist'
        });
    } else {
        response.redirect('/login');
    }
});

//Recommendations page
app.get('/recommended', async function(request, response) {
    if (request.session.username) {
        let username = request.session.username;
        response.render('recommend', {
            title: 'Recommend Songs',
            username: username
        });
    } else {
        response.redirect('/login');
    }
});

//Signup page
app.get('/signup', async function(request, response) {
    response.render('signup', {
        title: 'Signup'
    });
});

//Playlist player page
app.get('/player/:playlistname', async function(request, response) {
    if (request.session.username) {
        let username = request.session.username;
        let playlistname = request.params.playlistname;
        let outp = await findPlaylistUserTitle(username,playlistname);
        let songlist = outp.songs;
        //if playlist exists send player
        if (outp) {
            response.render('player', {
                title: 'Player',
                playlistname: playlistname,
                songs: songlist,
                username: username
            });
        } else {
            response.redirect(`/songsearch/${playlistname}`)
        }

    } else {
        response.redirect('/login');
    }
});

//Playlists view page
app.get('/playlists', async function(request, response) {
    if (request.session.username) {
        let username = request.session.username;
        let outp = await findPlaylistUser(username);
        //if there are playlists show them, else send empty list
        if (outp) {
            let playnames = [];

            for (i = 0; i < outp.length; i++){
                playnames.push(outp[i].title)
            }

            response.render('playlists', {
                title: 'Playlists',
                playlists: playnames
            });
        } else {
            response.render('playlists', {
                title: 'Playlists',
                playlists: []
            });
        }
    } else {
        response.redirect('/login');
    }
});

//Search songs page
app.get('/songsearch/:playlistname', async function(request, response) {
    if (request.session.username) {
        let username = request.session.username;
        let playlistname = request.params.playlistname;
        let outp = await findPlaylistUserTitle(username, playlistname);

        if (outp) {
            response.render('songsearch', {
                title: `Add songs to ${playlistname}`,
                playlistname: playlistname
            });
        } else {
            response.redirect('/playlists');
        }
    } else {
        response.redirect('/login');
    }
});

//Add song to playlist
app.get('/addsong/:playlistname/:songid', async function(request, response) {
    if (request.session.username) {
        let username = request.session.username;
        let playlistname = request.params.playlistname;
        let songid = request.params.songid;

        addSong(username, playlistname, songid);

        response.redirect('/playlists');
    } else {
        response.redirect('/login');
    }
});

//Remove songs from playlist
app.get('/delete/:playlistname/:songid', async function(request, response) {
    if (request.session.username) {
        let username = request.session.username;
        let playlistname = request.params.playlistname;
        let songid = request.params.songid;

        removeSong(username, playlistname, songid);
        response.redirect(`/player/${playlistname}`);
    } else {
        response.redirect('/login');
    }
});

//Remove playlist
app.get('/deleteplaylist/:playlistname', async function(request, response) {
    if (request.session.username) {
        let username = request.session.username;
        let playlistname = request.params.playlistname;

        deletePlaylist(username, playlistname);
        response.redirect(`/playlists`);
    } else {
        response.redirect('/login');
    }
});

//login post info
app.post('/login', async function(request, response) {
    if (await checkUser(request.body.username, request.body.password)) {
        request.session.username = request.body.username;
        response.redirect('/');
    } else {
        response.render('login', {
            title: "Login",
            message: 'Login failed, please try again'
        });
    }
});

//Signup post info
app.post('/signup', async function(request, response) {
    if (request.body.password != request.body.passwordconfirmation) {
        response.render('signup', {
            title: 'Signup', 
            message: "Passwords Don't Match"
        });
    } else if (await findUser(request.body.username)) {
        response.render('signup', {
            title: 'Signup', 
            message: 'Duplicate name, please try again' 
        });
    } else {
        addUser(request.body.username, request.body.password);
        response.redirect('/login');
    }
});

//Add playlist post info
app.post('/addplaylist', async function(request, response) {
    if (request.session.username) {
        let username = request.session.username;
        let playlistname = request.body.newplaylist;

        if (! await findPlaylistUserTitle(username, playlistname)) {
            addPlaylist(playlistname, username, []);
            response.redirect('/playlists');
        } else {
            response.render('newplaylist', {
                title: "Add New Playlist",
                message: 'Duplicate title, please try again' 
            });
        }
    } else {
        response.redirect('/login');
    }
});

app.set('port', 3000);

//listen to port with http
http.listen(app.get('port'), function() {
    console.log('Node.js/Express is listening on port ' + app.get('port'));
});