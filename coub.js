window.addEventListener('DOMNodeInserted', function (e) {
    if (e.target.nodeName != 'EMBED' && e.target.nodeName != 'OBJECT')
        return;

    CoubHtml5Player(e.target);
}, false);

document.addEventListener('visibilitychange', function (e) {
    if (e.target.hidden) {
        pauseAllVideo();
    }
}, false);


function pauseAllVideo(excludeVideoId) {
    excludeVideoId = excludeVideoId || '';

    var allContainerElements = document.getElementsByClassName('Html5CoubPlayer');
    for (var i = 0; i < allContainerElements.length; i++) {
        var containerElement = allContainerElements[i],
            videoTag = containerElement.getElementsByTagName('video')[0],
            audioTag = containerElement.getElementsByTagName('audio')[0];

        if (videoTag.id === excludeVideoId) {
            return;
        }

        containerElement.dataset.shouldByPlayedAfterLoading = false;
        videoTag.pause();
        audioTag.pause();
    }
}

function CoubHtml5Player(flashObject) {
    var CONTAINER_CLASS = 'Html5CoubPlayer',
        container = document.createElement('div'),

        video = document.createElement('video'),
        audio = document.createElement('audio'),

        videoLoaded = false,
        audioLoaded = false,
        hasExternalAudio = false,

        json = {};

    if (flashObject.childElementCount == 0) {
        throw new Error('Wrong flash object.');
    }

    json = getJSON();
    id = getVideoTagId();

    if (!json.hasOwnProperty('file_versions') || !json.file_versions.hasOwnProperty('web')) {
        throw new Error('Can\'t find video in json.');
    }

    if (!json.hasOwnProperty('audio_versions') || !json.audio_versions.hasOwnProperty('template')) {
        hasExternalAudio = false;
    }

    setupAudioTag();
    setupVideoTag();

    container.dataset.shouldByPlayedAfterLoading = true;
    container.setAttribute('class', CONTAINER_CLASS);
    container.appendChild(audio);
    container.appendChild(video);

    flashObject.parentNode.replaceChild(container, flashObject);

    console.log('Coub ' + json.permalink + ' replaced');

    function getJSON() {
        var flashVars = flashObject.querySelector('param[name="flashvars"]'),
            urlPartWithJSON = flashVars.value.split('&')[0],
            JSONText = decodeURIComponent(urlPartWithJSON).replace(/^json=/, ''),
            parsedJSON = JSON.parse(JSONText);

        if (typeof parsedJSON !== 'object') {
            throw new Error('Empty JSON');
        }

        return parsedJSON;
    }

    function canPlay() {
        var videoWithoutExternalAudioLoaded = !hasExternalAudio && videoLoaded,
            videoWithExternalAudioLoaded = videoLoaded && audioLoaded,
            pageVisible = !document.hidden,
            shouldByPlayedAfterLoading = container.dataset.shouldByPlayedAfterLoading == "true";

        return shouldByPlayedAfterLoading && pageVisible && (videoWithoutExternalAudioLoaded || videoWithExternalAudioLoaded);
    }

    function getAudioSource() {
        if (hasExternalAudio == true) {
            return false;
        }

        var audioJSON = json.audio_versions,
            quality;

        if (audioJSON.versions.indexOf('high') > -1) {
            quality = 'high';
        } else if (audioJSON.versions.indexOf('mid') > -1) {
            quality = 'mid';
        } else if (audioJSON.versions.indexOf('low') > -1) {
            quality = 'low';
        } else {
            throw new Error('Wrong audio quality.');
        }
        return audioJSON.template.replace(/%{version}/g, quality);
    }

    function onAudioEnded() {
        audio.currentTime = 0;
        audio.play();
    }

    function onAudioLoadedData() {
        audioLoaded = true;
        if (canPlay()) {
            video.play();
        }
    }

    function setupAudioTag() {
        var audioSource = getAudioSource();
        if (audioSource == false) {
            return;
        }
        audio.setAttribute('src', getAudioSource());
        audio.addEventListener('ended', onAudioEnded, false);
        audio.addEventListener('loadeddata', onAudioLoadedData, false);
    }


    function getVideoTagId() {
        return 'html5video_' + json.permalink;
    }

    function getVideoMimeType() {
        var videoJSON = json.file_versions.web,
            fileMimeType;

        if (videoJSON.types.indexOf('mp4') > -1) {
            fileMimeType = 'video/mp4';
        } else if (videoJSON.types.indexOf('flv') > -1) {
            fileMimeType = 'video/x-flv';
        } else {
            throw new Error('Wrong video MIME type');
        }

        return fileMimeType;
    }

    function getVideoSource() {
        var videoJSON = json.file_versions.web;

        var fileType;
        if (videoJSON.types.indexOf('mp4') > -1) {
            fileType = 'mp4';
        } else if (videoJSON.types.indexOf('flv') > -1) {
            fileType = 'flv';
        } else {
            throw new Error('Wrong video file format');
        }

        var videoSize;
        if (videoJSON.versions.indexOf('big') > -1) {
            videoSize = 'big';
        } else if (videoJSON.versions.indexOf('med') > -1) {
            videoSize = 'med';
        } else if (videoJSON.versions.indexOf('small') > -1) {
            videoSize = 'small';
        } else {
            throw new Error('Wrong video size');
        }

        return videoJSON.template.replace(/%{type}/g, fileType).replace(/%{version}/g, videoSize);
    }

    function onVideoPlay() {
        pauseAllVideo(getVideoTagId());
        audio.play();
    }

    function onVideoPause() {
        audio.pause();
    }

    function onVideoLoadedData() {
        videoLoaded = true;
        video.style.display = 'block';

        if (canPlay()) {
            pauseAllVideo(getVideoTagId());
            video.play();
        }
    }

    function setupVideoTag() {
        var videoSource = document.createElement('source');
        videoSource.setAttribute('src', getVideoSource());
        videoSource.setAttribute('type', getVideoMimeType());
        video.appendChild(videoSource);

        video.style.display = 'none';
        video.setAttribute('id', getVideoTagId());
        video.setAttribute('class', 'html5video');
        video.setAttribute('preload', 'auto');
        video.setAttribute('controls', 'true');
        video.setAttribute('loop', '');
        var flashVideoWidth = flashObject.parentNode.parentNode.firstElementChild.offsetWidth,
            flashVideoHeight = flashObject.parentNode.parentNode.firstElementChild.offsetHeight;
        video.setAttribute('width', flashVideoWidth);
        video.setAttribute('height', flashVideoHeight);

        video.addEventListener('play', onVideoPlay, false);
        video.addEventListener('pause', onVideoPause, false);
        video.addEventListener('loadeddata', onVideoLoadedData, false);
    }
}