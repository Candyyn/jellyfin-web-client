import Hls from "hls.js";
import JellyfinApi from "../../api/jellyfin.ts";
import {MediaItem, MediaStream} from "../../types/jellyfin.ts";


export interface VideoElementWithHls extends HTMLVideoElement {
    __hlsInstance?: Hls | null;
}

export interface PlayerState {
    isPlaying: boolean;
    volume: number;
    isMuted: boolean;
    currentTime: number;
    duration: number;
    isFullscreen: boolean;
    showControls: boolean;
    tracksMenuOpen: boolean;
    isLoading: boolean;
}

export interface AudioTracks {
    id: number;
    label: string;
    language: string;
}

export interface VideoState {
    selectedAudioTrack: number;
    selectedSubtitleIndex: number | null;

    subtitleTracks: MediaStream[];
    audioTracks: AudioTracks[];

    hasRestoredPosition: boolean;
}


export const getSubtitles = async (api: JellyfinApi, item: MediaItem, setVideoState: React.Dispatch<React.SetStateAction<VideoState>>): Promise<void> => {
    console.assert(api !== undefined);
    console.assert(item !== undefined);
    try {
        const subtitles = await api.fetchSubtitleTracks(item);
        if (subtitles) {
            setVideoState(prev => ({
                ...prev,
                subtitleTracks: subtitles
            }));
        }
    } catch (error) {
        console.error("Error fetching subtitles:", error);
    }
};
export const getAudioTracks = async (api: JellyfinApi, item: MediaItem, setVideoState: React.Dispatch<React.SetStateAction<VideoState>>): Promise<void> => {
    console.assert(api !== undefined);
    console.assert(item !== undefined);
    try {

        const tracks =
            item.MediaStreams?.filter((s) => s.Type === "Audio")?.map((s, idx) => ({
                id: s.Index,
                label: s.DisplayTitle ?? `Track ${idx + 1}`,
                language: s.Language ?? "",
            })) || [];
        if (tracks) {
            setVideoState(prev => ({
                ...prev,
                audioTracks: tracks
            }));
        }
    } catch (error) {
        console.error("Error fetching subtitles:", error);
    }
};

export const cleanUpVideoElement = (videoElement: VideoElementWithHls) => {
    if (videoElement.__hlsInstance) {
        videoElement.__hlsInstance.destroy();
        videoElement.__hlsInstance = null;
    }

    videoElement.onloadedmetadata = null;
}
export const SetupVideoPlayer = (videoElement: VideoElementWithHls, restoreTimeAndPlay: () => void, hls: React.MutableRefObject<Hls | null>) => {
    if (Hls.isSupported()) {
        hls.current = new Hls();
        hls.current.attachMedia(videoElement);
        hls.current.on(Hls.Events.MANIFEST_PARSED, () => {
            restoreTimeAndPlay();
        });
    } else {
        videoElement.addEventListener("loadedmetadata", restoreTimeAndPlay, {
            once: true,
        });
    }
}

function buildCodecString(videoInfo: MediaStream) {
    const {Codec, Profile, Level} = videoInfo;

    switch (Codec.toLowerCase()) {
        case 'h264':
        case 'avc1': {
            const profileMap = {
                'Baseline': '42',
                'Main': '4D',
                'High': '64',
                'High 10': '6E',
                'High 4:2:2': '7A',
                'High 4:4:4': 'F4',
            };
            // @ts-ignore
            const profileHex = profileMap[Profile] || '64'; // Default to High
            // @ts-ignore
            const levelInt = Math.round(Level * 10);        // e.g., 4.1 -> 41
            const levelHex = levelInt.toString(16).padStart(2, '0'); // -> "29"
            return `video/mp4; codecs="avc1.${profileHex}00${levelHex}"`;
        }

        case 'hevc':
        case 'h265':
            return 'video/mp4; codecs="hvc1.1.6.L93.B0"'; // Basic HEVC string

        case 'vp8':
            return 'video/webm; codecs="vp8"';

        case 'vp9':
            return 'video/webm; codecs="vp9"';

        case 'av1':
            return 'video/mp4; codecs="av01.0.05M.08"'; // Conservative AV1 profile

        case 'theora':
            return 'video/ogg; codecs="theora"';

        default:
            return null; // Unknown codec
    }
}

export function isSupportedCodecVideo(item: MediaItem): boolean {
    const sources = item?.MediaStreams;
    const videoSrc = sources?.filter(x => x.Type == "Video");
    if (videoSrc == undefined) {
        return false;
    }
    const mime = buildCodecString(videoSrc[0]);

    if (!mime) {
        console.warn(`Unsupported codec: ${videoSrc[0].Codec}`);
        return false;
    }
    const video = document.createElement('video');
    const result = video.canPlayType(mime);
    video.remove();
    console.log('Supports directplay, ', result === 'probably' || result === 'maybe');
    return result === 'probably' || result === 'maybe';
}


export const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};