﻿(function (window, store) {

    function getDeviceProfile(serverAddress, deviceId, item, startPositionTicks, maxBitrate, mediaSourceId, audioStreamIndex, subtitleStreamIndex) {

        var bitrateSetting = AppSettings.maxStreamingBitrate();

        var profile = {};

        profile.MaxStreamingBitrate = bitrateSetting;
        profile.MaxStaticBitrate = 40000000;
        profile.MusicStreamingTranscodingBitrate = Math.min(bitrateSetting, 192000);

        profile.DirectPlayProfiles = [];

        profile.DirectPlayProfiles.push({
            Container: 'mkv,mov,mp4,m4v,wmv',
            Type: 'Video'
        });

        profile.DirectPlayProfiles.push({
            Container: 'aac,mp3,flac,wma',
            Type: 'Audio'
        });

        profile.TranscodingProfiles = [];

        profile.TranscodingProfiles.push({
            Container: 'ts',
            Type: 'Video',
            AudioCodec: 'aac',
            VideoCodec: 'h264',
            Context: 'Streaming',
            Protocol: 'hls'
        });

        profile.TranscodingProfiles.push({
            Container: 'aac',
            Type: 'Audio',
            AudioCodec: 'aac',
            Context: 'Streaming',
            Protocol: 'hls'
        });

        profile.ContainerProfiles = [];

        var audioConditions = [];

        var maxAudioChannels = '6';

        audioConditions.push({
            Condition: 'LessThanEqual',
            Property: 'AudioChannels',
            Value: maxAudioChannels
        });

        profile.CodecProfiles = [];
        profile.CodecProfiles.push({
            Type: 'Audio',
            Conditions: audioConditions
        });

        profile.CodecProfiles.push({
            Type: 'VideoAudio',
            Codec: 'mp3',
            Conditions: [{
                Condition: 'LessThanEqual',
                Property: 'AudioChannels',
                Value: maxAudioChannels
            }]
        });

        profile.CodecProfiles.push({
            Type: 'VideoAudio',
            Codec: 'aac',
            Conditions: [
                {
                    Condition: 'LessThanEqual',
                    Property: 'AudioChannels',
                    Value: maxAudioChannels
                }
            ]
        });

        profile.CodecProfiles.push({
            Type: 'Video',
            Codec: 'h264',
            Conditions: [
            {
                Condition: 'EqualsAny',
                Property: 'VideoProfile',
                Value: 'high|main|baseline|constrained baseline'
            },
            {
                Condition: 'LessThanEqual',
                Property: 'VideoLevel',
                Value: '41'
            }]
        });

        // Subtitle profiles
        profile.SubtitleProfiles = [];
        profile.ResponseProfiles = [];

        return profile;
    }

    function validatePlaybackInfoResult(result) {

        if (result.ErrorCode) {

            MediaController.showPlaybackInfoErrorMessage(result.ErrorCode);
            return false;
        }

        return true;
    }

    function getOptimalMediaSource(mediaType, versions) {

        var optimalVersion = versions.filter(function (v) {

            v.enableDirectPlay = MediaController.supportsDirectPlay(v);

            return v.enableDirectPlay;

        })[0];

        if (!optimalVersion) {
            optimalVersion = versions.filter(function (v) {

                return v.SupportsDirectStream;

            })[0];
        }

        return optimalVersion || versions.filter(function (s) {
            return s.SupportsTranscoding;
        })[0];
    }

    var currentMediaSource;
    var currentItem;
    var basePlayerState;
    var progressInterval;

    function getVideoUrl(item) {

        var deferred = $.Deferred();
        Dashboard.showModalLoadingMsg();

        var deviceProfile = getDeviceProfile();
        var startPosition = 0;

        MediaController.getPlaybackInfo(item.Id, deviceProfile, startPosition).done(function (playbackInfoResult) {

            if (validatePlaybackInfoResult(playbackInfoResult)) {

                var mediaSource = getOptimalMediaSource(item.MediaType, playbackInfoResult.MediaSources);

                if (mediaSource) {

                    if (mediaSource.RequiresOpening) {

                        MediaController.getLiveStream(item.Id, playbackInfoResult.PlaySessionId, deviceProfile, startPosition, mediaSource, null, null).done(function (openLiveStreamResult) {

                            openLiveStreamResult.MediaSource.enableDirectPlay = MediaController.supportsDirectPlay(openLiveStreamResult.MediaSource);

                            playInternalPostMediaSourceSelection(item, openLiveStreamResult.MediaSource, startPosition, deferred);
                        });

                    } else {
                        playInternalPostMediaSourceSelection(item, mediaSource, startPosition, deferred);
                    }
                } else {
                    Dashboard.hideModalLoadingMsg();
                    MediaController.showPlaybackInfoErrorMessage('NoCompatibleStream');
                }
            }

        });

        return deferred.promise();
    }

    function playInternalPostMediaSourceSelection(item, mediaSource, startPosition, deferred) {

        Dashboard.hideModalLoadingMsg();

        currentItem = item;
        currentMediaSource = mediaSource;

        basePlayerState = {
            PlayState: {

            }
        };

        var currentSrc = MediaPlayer.createStreamInfo('Video', item, mediaSource, startPosition).url;

        var audioStreamIndex = getParameterByName('AudioStreamIndex', currentSrc);

        if (audioStreamIndex) {
            basePlayerState.PlayState.AudioStreamIndex = parseInt(audioStreamIndex);
        }
        basePlayerState.PlayState.SubtitleStreamIndex = self.currentSubtitleStreamIndex;

        basePlayerState.PlayState.PlayMethod = getParameterByName('static', currentSrc) == 'true' ?
            'DirectStream' :
            'Transcode';

        basePlayerState.PlayState.LiveStreamId = getParameterByName('LiveStreamId', currentSrc);
        basePlayerState.PlayState.PlaySessionId = getParameterByName('PlaySessionId', currentSrc);

        basePlayerState.PlayState.MediaSourceId = mediaSource.Id;
        basePlayerState.PlayState.CanSeek = false;
        basePlayerState.NowPlayingItem = MediaPlayer.getNowPlayingItemForReporting(item, mediaSource);

        deferred.resolveWith(null, [currentSrc]);
    }

    function getPlayerUrl(videoUrl, player) {

        return player.scheme.replace('{0}', videoUrl);
    }

    function getPlayerState(positionTicks) {

        var state = basePlayerState;

        state.PlayState.PositionTicks = positionTicks;

        return state;
    }

    function onPlaybackStart() {

        var state = getPlayerState();

        var info = {
            ItemId: state.NowPlayingItem.Id,
            NowPlayingItem: state.NowPlayingItem
        };

        info = $.extend(info, state.PlayState);

        ApiClient.reportPlaybackStart(info);

        // This is really just a ping to let the server know we're still playing
        progressInterval = setInterval(function () {
            onPlaybackProgress(null);

        }, 10000);
    }

    function onPlaybackProgress(positionTicks) {

        var state = getPlayerState(positionTicks);

        var info = {
            ItemId: state.NowPlayingItem.Id,
            NowPlayingItem: state.NowPlayingItem
        };

        info = $.extend(info, state.PlayState);

        ApiClient.reportPlaybackProgress(info);
    }

    function onPlaybackStopped(positionTicks) {

        var state = getPlayerState(positionTicks);

        var stopInfo = {
            itemId: state.NowPlayingItem.Id,
            mediaSourceId: state.PlayState.MediaSourceId,
            positionTicks: state.PlayState.PositionTicks
        };

        if (state.PlayState.LiveStreamId) {
            stopInfo.LiveStreamId = state.PlayState.LiveStreamId;
        }

        if (state.PlayState.PlaySessionId) {
            stopInfo.PlaySessionId = state.PlayState.PlaySessionId;
        }

        ApiClient.reportPlaybackStopped(stopInfo);

        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    function showPostPlayMenu(item) {

        $('.externalPlayerPostPlayFlyout').popup("close").remove();

        var html = '<div data-role="popup" class="externalPlayerPostPlayFlyout" data-history="false" data-theme="a" data-dismissible="false">';

        html += '<ul data-role="listview" style="min-width: 220px;">';
        html += '<li data-role="list-divider" style="padding: 1em;text-align:center;">' + Globalize.translate('HeaderExternalPlayerPlayback') + '</li>';
        html += '</ul>';

        html += '<div style="padding:1em;">';

        var autoMarkWatched = item.RunTimeTicks;

        if (item.RunTimeTicks && item.RunTimeTicks >= 3000000000) {

            autoMarkWatched = false;

            html += '<fieldset data-role="controlgroup">';
            html += '<legend>' + Globalize.translate('LabelMarkAs') + '</legend>';
            html += '<label for="radioMarkUnwatched">' + Globalize.translate('OptionUnwatched') + '</label>';
            html += '<input type="radio" id="radioMarkUnwatched" name="radioGroupMarkPlaystate" class="radioPlaystate" />';
            html += '<label for="radioMarkWatched">' + Globalize.translate('OptionWatched') + '</label>';
            html += '<input type="radio" id="radioMarkWatched" checked="checked" name="radioGroupMarkPlaystate" class="radioPlaystate" />';
            html += '<label for="radioMarkInProgress">' + Globalize.translate('OptionInProgress') + '</label>';
            html += '<input type="radio" id="radioMarkInProgress" name="radioGroupMarkPlaystate" class="radioPlaystate" />';
            html += '</fieldset>';

            html += '<br/>';

            html += '<p style="margin-top: 0;">' + Globalize.translate('LabelResumePoint') + '</p>';

            html += '<div class="sliderContainer" style="display:block;margin-top:4px;">';
            html += '<input class="playstateSlider" type="range" step=".001" min="0" max="100" value="0" style="display:none;" data-theme="a" data-highlight="true" />';
            html += '</div>';
            html += '<div class="sliderValue" style="text-align:center;margin:2px 0 4px;">0:00:00</div>';

            html += '<br/>';
        }

        html += '<button type="button" class="btnDone" data-theme="b" data-icon="check">' + Globalize.translate('ButtonImDone') + '</button>';

        html += '</div>';

        html += '</div>';

        $(document.body).append(html);

        var elem = $('.externalPlayerPostPlayFlyout').popup({}).trigger('create').popup("open").on("popupafterclose", function () {

            $(this).off("popupafterclose").remove();

        });

        $('.radioPlaystate', elem).on('change', function () {

            if ($('#radioMarkInProgress', elem).checked()) {

                $('.playstateSlider', elem).slider('enable');

            } else {
                $('.playstateSlider', elem).slider('disable');
            }

        }).trigger('change');

        $('.btnDone', elem).on('click', function () {

            $('.externalPlayerPostPlayFlyout').popup("close").remove();

            var position = 0;

            if ($('#radioMarkInProgress', elem).checked()) {

                var pct = $(".playstateSlider", elem).val();
                var ticks = item.RunTimeTicks * (Number(pct) * .01);

                position = ticks;
            }
            else if (autoMarkWatched || $('#radioMarkWatched', elem).checked()) {

                position = currentMediaSource.RunTimeTicks;
            }
            else if ($('#radioMarkUnwatched', elem).checked()) {

                position = 0;
            }
            onPlaybackStopped(position);
        });

        $(".playstateSlider", elem).on("change", function (e) {

            var pct = $(this).val();

            var time = item.RunTimeTicks * (Number(pct) * .01);

            var tooltext = Dashboard.getDisplayTime(time);

            $('.sliderValue', elem).html(tooltext);

            console.log("slidin", pct, self.currentDurationTicks, time);

        });
    }

    function closePlayMenu() {
        $('.externalPlayerFlyout').popup("close").remove();
    }

    function getExternalPlayers() {

        return [
            { name: 'Vlc', scheme: 'vlc://{0}' }
        ];

    }

    function showMenuForItem(item, videoUrl) {

        closePlayMenu();

        var html = '<div data-role="popup" class="externalPlayerFlyout" data-theme="a" data-dismissible="false">';

        html += '<ul data-role="listview" style="min-width: 200px;">';
        html += '<li data-role="list-divider" style="padding: 1em;text-align:center;">' + Globalize.translate('HeaderSelectExternalPlayer') + '</li>';
        html += '</ul>';

        html += '<div style="padding:1em;">';

        html += getExternalPlayers().map(function (p) {

            return '<a href="' + getPlayerUrl(videoUrl, p) + '" data-role="button" data-icon="play" class="btnExternalPlayer" data-theme="b" data-mini="true">' + p.name + '</a>';

        }).join('');

        html += '</div>';

        html += '</div>';

        $(document.body).append(html);

        var elem = $('.externalPlayerFlyout').popup({}).trigger('create').popup("open").on("popupafterclose", function () {

            $(this).off("popupafterclose").remove();

        });

        $('.btnExternalPlayer', elem).on('click', function () {

            onPlaybackStart();
            closePlayMenu();

            setTimeout(function () {

                showPostPlayMenu(item);
            }, 500);
        });
    }

    function showPlayMenu(itemId) {

        var userId = Dashboard.getCurrentUserId();

        ApiClient.getItem(userId, itemId).done(function (item) {

            getVideoUrl(item).done(function (url) {
                ExternalPlayer.showPlayerSelectionMenu(item, url);
            });
        });
    }

    function showPlayerSelectionMenu(item, url) {

        setTimeout(function () {

            showMenuForItem(item, url);
        }, 500);
    }

    window.ExternalPlayer = {

        showMenu: showPlayMenu,
        showPlayerSelectionMenu: showPlayerSelectionMenu,
        onPlaybackStart: onPlaybackStart,
        onPlaybackStopped: onPlaybackStopped
    };

})(window, window.appStorage);