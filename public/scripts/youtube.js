let api_key = apiKeys.google;


//get data query with youtube search term or data query
function dataList(query) {
    let url = `https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet&q=${query}&key=${api_key}`;
    let totalData = [];

    return $.getJSON(url, function(data) {
        let titles = [];
        let images = [];
        let channels = [];
        let ids = [];

        //get all data from queries
        $.each(data.items, function(index, item) {
            if (renderTitle(item) != "") {
                titles.push(renderTitle(item));
            }

            if (renderImage(item) != "") {
                images.push(renderImage(item));
            }

            if (renderChannel(item) != "") {
                channels.push(renderChannel(item));
            }

            if (renderId(item) != "") {
                ids.push(renderId(item));
            }
        });

        //array of arrays
        totalData = [ids, titles, channels, images];

    }).then(function(data) { return(totalData); });
}

//stores title
function renderTitle(item) {
    if (item.id.kind === 'youtube#video') {
        return item.snippet.title;
    } else {
        return '';
    }
}

//stores video thumbnail
function renderImage(item) {
    if (item.id.kind === 'youtube#video') {
        return item.snippet.thumbnails.medium.url;
    } else {
        return '';
    }
}

//stores channelname
function renderChannel(item) {
    if (item.id.kind === 'youtube#video') {
        return item.snippet.channelTitle;
    } else {
        return '';
    }
}

//stores id
function renderId(item) {
    if (item.id.kind === 'youtube#video') {
        return item.id.videoId;
    } else {
        return '';
    }
}