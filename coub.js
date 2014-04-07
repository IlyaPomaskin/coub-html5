window.addEventListener('DOMNodeInserted', function (e) {
    if (e.target.nodeName != 'EMBED' && e.target.nodeName != 'OBJECT')
        return;

    replaceWithHTML5(e.target);
}, false);

document.addEventListener('visibilitychange', function(e){
    if (e.target.hidden) {
        pauseAllVideos();
    }
}, false);

function pauseAllVideos() {
    var oldVideos = document.getElementsByTagName('video');
    for (var i = 0; i < oldVideos.length; i++) {
        oldVideos[i].pause();
    }
}

function replaceWithHTML5(flashObject) {
    if (flashObject.childElementCount == 0) {
        console.log('Wrong flash object');
        return false;
    }

    var playerContainer = flashObject.parentNode,
        videoLoaded = false,
        audioLoaded = false,
        html5video = document.createElement('video'),
        html5audio = document.createElement('audio'),
        hasExternalAudio = false,
        json = JSON.parse(decodeURIComponent(flashObject.querySelector('param[name="flashvars"]').value.split('&')[0]).replace(/^json=/, ''));

    if (typeof json !== 'object') {
        console.log('Empty JSON');
        return false;
    }

    if (json.audio_versions !== undefined && json.audio_versions.template !== undefined) {
        hasExternalAudio = true;

        if (json.audio_versions.versions.indexOf('high') > -1) {
            html5audio.src = json.audio_versions.template.replace(/%{version}/g, 'high');
        } else if (json.audio_versions.versions.indexOf('mid') > -1) {
            html5audio.src = json.audio_versions.template.replace(/%{version}/g, 'mid');
        } else {
            html5audio.src = json.audio_versions.template.replace(/%{version}/g, 'low');
        }

        html5audio.addEventListener('ended', function () {
            html5audio.currentTime = 0;
            html5audio.play();
        }, false);

        html5audio.addEventListener('loadeddata', function () {
            audioLoaded = true;
            if (videoLoaded && audioLoaded) {
                pauseAllVideos();
                html5video.play();
            }
        }, false);
    }

    if (json.file_versions !== undefined && json.file_versions.web !== undefined) {
        var html5video_src = document.createElement('source'),
            src = '';

        if (json.file_versions.web.types.indexOf('mp4') > -1) {
            src = json.file_versions.web.template.replace(/%{type}/g, 'mp4');
            html5video_src.setAttribute('type', 'video/mp4');
        } else {
            src = json.file_versions.web.template.replace(/%{type}/g, 'flv');
            html5video_src.setAttribute('type', 'video/x-flv');
        }

        if (json.file_versions.web.versions.indexOf('big') > -1) {
            html5video_src.setAttribute('src', src.replace(/%{version}/g, 'big'));
        } else if (json.file_versions.web.versions.indexOf('med') > -1) {
            html5video_src.setAttribute('src', src.replace(/%{version}/g, 'med'));
        } else {
            html5video_src.setAttribute('src', src.replace(/%{version}/g, 'small'));
        }

        html5video.appendChild(html5video_src);

        html5video.style.display = 'none';
        html5video.setAttribute('class', 'html5video');
        html5video.setAttribute('preload', 'auto');
        html5video.setAttribute('controls', 'true');
        html5video.setAttribute('loop', '');
        html5video.setAttribute('width', playerContainer.offsetWidth);
        html5video.setAttribute('height', playerContainer.offsetHeight);

        html5video.addEventListener('play', function () {
            html5audio.play();
        }, false);

        html5video.addEventListener('pause', function () {
            html5audio.pause();
        }, false);

        html5video.addEventListener('loadeddata', function () {
            videoLoaded = true;
            html5video.style.display = 'block';
            if ((!hasExternalAudio || videoLoaded && audioLoaded) && !document.hidden) {
                pauseAllVideos();
                html5video.play();
            }
        }, false);

        html5video.appendChild(html5audio);
        playerContainer.replaceChild(html5video, flashObject);

        console.log('Coub ' + json.permalink + ' replaced');
        return true;
    }

    return false;
}