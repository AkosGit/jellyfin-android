define(["browser"],function(e){function o(){var e=document.createElement("video");return!(!e.canPlayType||!e.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/,""))}function i(){return null==u&&(u=null!=document.createElement("video").textTracks),u}function n(){return null==l&&(l=a()||t()),l}function a(){var e=document.createElement("video");return e.canPlayType("application/x-mpegURL").replace(/no/,"")||e.canPlayType("application/vnd.apple.mpegURL").replace(/no/,"")?!0:!1}function t(){return null==window.MediaSource||e.firefox?!1:!0}function r(e){var o;return"opus"==e?(o='audio/ogg; codecs="opus"',document.createElement("audio").canPlayType(o).replace(/no/,"")?!0:!1):(o="webma"==e?"audio/webm":"audio/"+e,document.createElement("audio").canPlayType(o).replace(/no/,"")?!0:!1)}function s(){if(e.chrome){var o=navigator.userAgent.toLowerCase();return e.operaTv?!1:-1!=o.indexOf("vivaldi")||-1!=o.indexOf("opera")?!1:!0}return e.tizen?!0:!1}function c(){return e.tizen||e.web0s}function d(o){var i=!1;switch(o){case"3gp":case"avi":case"asf":case"flv":case"mpg":case"mpeg":case"mts":case"trp":case"vob":case"vro":i=e.tizen;break;case"m2ts":case"wmv":i=e.tizen||e.web0s;break;case"ts":if(i=e.tizen||e.web0s)return{Container:"ts,mpegts",Type:"Video"}}return i?{Container:o,Type:"Video"}:null}function p(){if(e.xboxOne)return 1e7;var o=navigator.userAgent.toLowerCase();return e.tizen?-1!=o.indexOf("tizen 2.3")?2e7:4e7:1e8}var u,l;return function(a){a=a||{};var t=a.audioChannels||2,u=p(),l=document.createElement("video"),m=l.canPlayType("video/webm").replace(/no/,""),C=s(),f=c(),y={};y.MaxStreamingBitrate=u,y.MaxStaticBitrate=1e8,y.MusicStreamingTranscodingBitrate=Math.min(u,192e3),y.DirectPlayProfiles=[];var h=[],P=[],T=l.canPlayType('video/mp4; codecs="avc1.640029, mp4a.69"').replace(/no/,"")||l.canPlayType('video/mp4; codecs="avc1.640029, mp4a.6B"').replace(/no/,"");l.canPlayType('audio/mp4; codecs="ac-3"').replace(/no/,"")&&(e.safari||(h.push("ac3"),e.edge&&e.mobile||P.push("ac3")));var v=!1;(C||f)&&T&&!e.tizen&&(v=!0,h.push("mp3"),P.push("mp3")),l.canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.2"').replace(/no/,"")&&(h.push("aac"),P.push("aac")),!v&&T&&(h.push("mp3"),P.push("mp3")),o()&&y.DirectPlayProfiles.push({Container:"mp4,m4v",Type:"Video",VideoCodec:"h264",AudioCodec:h.join(",")}),C&&y.DirectPlayProfiles.push({Container:"mkv,mov",Type:"Video",VideoCodec:"h264",AudioCodec:h.join(",")}),["m2ts","wmv","ts"].map(d).filter(function(e){return null!=e}).forEach(function(e){y.DirectPlayProfiles.push(e)}),["opus","mp3","aac","flac","webma"].filter(r).forEach(function(e){y.DirectPlayProfiles.push({Container:"webma"==e?"webma,webm":e,Type:"Audio"}),"aac"==e&&y.DirectPlayProfiles.push({Container:"m4a",AudioCodec:e,Type:"Audio"})}),m&&y.DirectPlayProfiles.push({Container:"webm",Type:"Video"}),y.TranscodingProfiles=[],["opus","mp3","aac"].filter(r).forEach(function(e){y.TranscodingProfiles.push({Container:e,Type:"Audio",AudioCodec:e,Context:"Streaming",Protocol:"http"}),y.TranscodingProfiles.push({Container:e,Type:"Audio",AudioCodec:e,Context:"Static",Protocol:"http"})}),C&&a.supportsCustomSeeking&&y.TranscodingProfiles.push({Container:"mkv",Type:"Video",AudioCodec:h.join(","),VideoCodec:"h264",Context:"Streaming",CopyTimestamps:!0}),f&&a.supportsCustomSeeking&&y.TranscodingProfiles.push({Container:"ts",Type:"Video",AudioCodec:h.join(","),VideoCodec:"h264",Context:"Streaming",CopyTimestamps:!0,MaxAudioChannels:t.toString()}),n()&&y.TranscodingProfiles.push({Container:"ts",Type:"Video",AudioCodec:P.join(","),VideoCodec:"h264",Context:"Streaming",Protocol:"hls"}),e.firefox&&y.TranscodingProfiles.push({Container:"mp4",Type:"Video",AudioCodec:h.join(","),VideoCodec:"h264",Context:"Streaming",Protocol:"http"}),m&&y.TranscodingProfiles.push({Container:"webm",Type:"Video",AudioCodec:"vorbis",VideoCodec:"vpx",Context:"Streaming",Protocol:"http",MaxAudioChannels:t.toString()}),y.TranscodingProfiles.push({Container:"mp4",Type:"Video",AudioCodec:h.join(","),VideoCodec:"h264",Context:"Streaming",Protocol:"http",MaxAudioChannels:t.toString()}),y.TranscodingProfiles.push({Container:"mp4",Type:"Video",AudioCodec:h.join(","),VideoCodec:"h264",Context:"Static",Protocol:"http"}),y.ContainerProfiles=[],y.CodecProfiles=[],y.CodecProfiles.push({Type:"Audio",Conditions:[{Condition:"LessThanEqual",Property:"AudioChannels",Value:"2"}]});var V="6";l.canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.5"').replace(/no/,"")||y.CodecProfiles.push({Type:"VideoAudio",Codec:"aac",Conditions:[{Condition:"NotEquals",Property:"AudioProfile",Value:"HE-AAC"},{Condition:"LessThanEqual",Property:"AudioChannels",Value:V},{Condition:"LessThanEqual",Property:"AudioBitrate",Value:"128000"},{Condition:"Equals",Property:"IsSecondaryAudio",Value:"false",IsRequired:"false"}]}),y.CodecProfiles.push({Type:"VideoAudio",Conditions:[{Condition:"LessThanEqual",Property:"AudioChannels",Value:V},{Condition:"Equals",Property:"IsSecondaryAudio",Value:"false",IsRequired:"false"}]});var g="41";return e.chrome&&!e.mobile&&(g="51"),y.CodecProfiles.push({Type:"Video",Codec:"h264",Conditions:[{Condition:"NotEquals",Property:"IsAnamorphic",Value:"true",IsRequired:!1},{Condition:"EqualsAny",Property:"VideoProfile",Value:"high|main|baseline|constrained baseline"},{Condition:"LessThanEqual",Property:"VideoLevel",Value:g}]}),y.CodecProfiles.push({Type:"Video",Codec:"vpx",Conditions:[{Condition:"NotEquals",Property:"IsAnamorphic",Value:"true",IsRequired:!1}]}),y.SubtitleProfiles=[],i()&&y.SubtitleProfiles.push({Format:"vtt",Method:"External"}),y.ResponseProfiles=[],y.ResponseProfiles.push({Type:"Video",Container:"m4v",MimeType:"video/mp4"}),y.ResponseProfiles.push({Type:"Video",Container:"mov",MimeType:"video/webm"}),y}});