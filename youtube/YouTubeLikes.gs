const LIKE = '👍';
const DISLIKE = '👎';
const LIKECNT = '+LKCNT';
const DISLIKECNT = '-LKCNT';

const VIDEOLIMIT=10000;

const templateLikes = `| ${LIKE}: ${LIKECNT} | ${DISLIKE}: ${DISLIKECNT}`;


/**
 * main function, finds last uploaded video and updates it
 */
function updateLatestVideo(){
  var myChannels = YouTube.Channels.list('contentDetails', {mine: true});
  // 2. Iterate through the channels and get the uploads playlist ID
  var item = myChannels.items[0];
    var uploadsPlaylistId = item.contentDetails.relatedPlaylists.uploads;
    
    var playlistResponse = YouTube.PlaylistItems.list('snippet', {
      playlistId: uploadsPlaylistId,
    });
    var id = playlistResponse.items[0].snippet.resourceId.videoId;
    _updateVideoById(id);
  console.log(`id: ${id}`)
  return id;
}

/**
 * main function, queries all uploaded video and updates them
 */
function updateAllVideos() {
  var results = YouTube.Channels.list('contentDetails', {mine: true});
  for(var i in results.items) {
    var item = results.items[i];
    // Get the playlist ID, which is nested in contentDetails, as described in the
    // Channel resource: https://developers.google.com/youtube/v3/docs/channels
    var playlistId = item.contentDetails.relatedPlaylists.uploads;
    var nextPageToken = '';

    // This loop retrieves a set of playlist items and checks the nextPageToken in the
    // response to determine whether the list contains additional items. It repeats that process
    // until it has retrieved all of the items in the list.
    while (nextPageToken != null) {
      var playlistResponse = YouTube.PlaylistItems.list('snippet', {
        playlistId: playlistId,
        maxResults: 9999,
        pageToken: nextPageToken
      });

      var list = playlistResponse.items.filter(function(value) {
        return _videoFilter(value);
        });
      
      var itemLimit = VIDEOLIMIT <= list.length ? VIDEOLIMIT: list.length;

      for (var j = 0; j < itemLimit; j++) {
        var playlistItem = list[j];
        var mId = playlistItem.snippet.resourceId.videoId;
        _updateVideoById(mId);
      }
      nextPageToken = playlistResponse.nextPageToken;
    }
  }
}

const updateLatestVideoByTrigger = (e = null) => {
  
  const triggerName = 'updateLatestVideo';
    const triggers = ScriptApp.getProjectTriggers().filter((trigger) => {
      return trigger.getHandlerFunction() === triggerName;
    });

    // If time based trigger doesn't exist, create one that runs every 5 minutes
    if (triggers.length === 0) {
      ScriptApp.newTrigger(triggerName).timeBased().everyMinutes(5).create();
    }
    updateLatestVideo();
};
const updateAllVideosByTrigger = (e = null) => {
  
  const triggerName = 'updateAllVideos';
    const triggers = ScriptApp.getProjectTriggers().filter((trigger) => {
      return trigger.getHandlerFunction() === triggerName;
    });

    // If time based trigger doesn't exist, create one that runs every 5 minutes
    if (triggers.length === 0) {
      ScriptApp.newTrigger(triggerName).timeBased().everyDays(1).create();
    }
    updateLatestVideo();
};

/**
 *function filters lists of video ids
 check link below for available methods to filter
 https://developers.google.com/youtube/v3/docs/playlistItems?hl=de
 */
function _videoFilter(value) {  
  return true;//value.snippet.title.includes("noobs");
}

/**
 * private function, finds video by id and updates it.
 */
function _updateVideoById(id) {
  
  // Get the watch statistics of the video
  const { items: [video = {}] = [] } = YouTube.Videos.list('snippet,statistics',{ id }
  );

  // Parse the YouTube API response to get views and comment count
  const {
    snippet: { title: oldTitle, categoryId } = {},
    statistics: { likeCount, dislikeCount } = {}
  } = video;
  
  console.log(`${LIKE}: ${likeCount}\n${DISLIKE}: ${dislikeCount}`);
  const newTitle = _getTitle(oldTitle, likeCount, dislikeCount);
    
    // If the video title has not changed, skip this step
      if (oldTitle !== newTitle) {
      YouTube.Videos.update({ id, snippet: { title: newTitle, categoryId } },'snippet');
      console.log(`new: ${newTitle}\nOld: ${oldTitle}`);
      } else{
        console.log(`old: ${oldTitle}`);
      }
}


/**
 * private function, gets original title from video and parse it.
 */
function _getTitle(old, likeCount, dislikeCount){
  var newT = "";
  if(old.includes(`${LIKECNT}`)){//+VWCNT
    newT = old.replace(`${LIKECNT}`, likeCount).replace(`${DISLIKECNT}`, dislikeCount);
    console.info("1")
  } else if(!old.includes(templateLikes)){
    newT =`${old.split(`| ${LIKE}:`)[0]} ${templateLikes.replace(`${LIKECNT}`, likeCount).replace(`${DISLIKECNT}`, dislikeCount)}`;
    console.info("2")
  } else{
    var newT2 = old.split(`| ${LIKECNT}:`)[0];
    var newT3 =newT2+templateLikes;
    newT =newT3.replace(`${LIKECNT}`, likeCount).replace(`${DISLIKECNT}`, dislikeCount);
    console.info("3")
  }
  return newT;
}
