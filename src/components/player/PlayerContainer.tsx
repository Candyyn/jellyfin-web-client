import React, {useEffect, useRef, useState} from "react";
import {
    cleanUpVideoElement, formatTime, getAudioTracks, getSubtitles,
    isSupportedCodecVideo,
    PlayerState,
    SetupVideoPlayer,
    VideoElementWithHls, VideoState
} from "./PlayerContainer.logic.ts";
import Hls from "hls.js";
import {useAuth} from "../../context/AuthContext.tsx";
import {useMediaItem} from "../../hooks/useMediaData.ts";
import clsx from "clsx";
import {
    ArrowLeft,
    ChevronsLeft,
    ChevronsRight, Loader2,
    Maximize,
    Minimize,
    Pause,
    Play,
    Volume1,
    Volume2,
    VolumeX,
} from "lucide-react";
import TracksMenu from "../ui/TracksMenu.tsx";
import SubtitleTrack from "../ui/SubtitleTrack.tsx";
import {useNavigate} from "react-router-dom";
//import TracksMenu from "../ui/TracksMenu.tsx";


const PlayerContainer: React.FC = () => {
    const {api} = useAuth();
    //const {itemId} = useParams<{ itemId: string }>();
    const itemId = "f54832154fa58b94202253d463762174"
    const {item} = useMediaItem(itemId);
    const navigate = useNavigate();


    const videoRef = useRef<VideoElementWithHls>(null);
    const hlsRef = useRef<Hls | null>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


    const [playerState, setPlayerState] = useState<PlayerState>({
        isPlaying: false,
        currentTime: -1,
        duration: 0,
        isFullscreen: false,
        isMuted: false,
        showControls: false,
        volume: 0,
        isLoading: true,
        tracksMenuOpen: false,
        lastReported: 0,
    });
    const [videoState, setVideoState] = useState<VideoState>({
        audioTracks: [],
        subtitleTracks: [],
        selectedAudioTrack: 0,
        selectedSubtitleIndex: null,
        hasRestoredPosition: false,
    });

    const restoreTimeAndPlay = React.useCallback(() => {
        if (!item) return;
        if (!videoRef.current) return;

        //videoRef.current.currentTime = 20;
        if (!videoState.hasRestoredPosition) {
            if (Object.prototype.hasOwnProperty.call(item.UserData, 'PlaybackPositionTicks')) {
                if (item.UserData.PlaybackPositionTicks != undefined) {
                    videoRef.current.currentTime = Math.floor(item.UserData.PlaybackPositionTicks / 10000000);
                }

            }

            setVideoState(prev => ({
                ...prev,
                hasRestoredPosition: true
            }));
            videoRef.current.play();
        }
    }, [item]);
    const handleUserInput = () => {
        setPlayerState(prev => ({
            ...prev,
            showControls: true
        }));

        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }

        if (playerState.showControls) {
            controlsTimeoutRef.current = setTimeout(() => {
                if (playerState.isPlaying && !playerState.tracksMenuOpen) {
                    setPlayerState(prev => ({
                        ...prev,
                        showControls: false
                    }));
                }
            }, 3000);
        }

    };
    const toggleFullscreen = () => {
    }
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;

        const newTime = parseFloat(e.target.value);
        setPlayerState(prev => ({
            ...prev,
            currentTime: newTime
        }));
        videoRef.current.currentTime = newTime;
    };

    const togglePlay = React.useCallback(() => {
        if (!videoRef.current) return;

        if (playerState.isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
    }, [playerState.isPlaying]);

    /** TEMP **/
    const updateAudioTrack = (id: number) => {
        setVideoState(prev => ({
            ...prev,
            selectedAudioTrack: id
        }));
    }
    const updateSubtitleIndex = (index: number | null) => {
        setVideoState(prev => ({
            ...prev,
            selectedSubtitleIndex: index
        }));
    }
    const setTrackOpen = (open: boolean) => {
        setPlayerState(prev => ({
            ...prev,
            tracksMenuOpen: open
        }));
    }

    useEffect(() => {
        if (api == null || item == null) return
        const videoElement: VideoElementWithHls | null = videoRef.current;
        if (videoElement == null) return;

        cleanUpVideoElement(videoElement);
        SetupVideoPlayer(videoElement, restoreTimeAndPlay, hlsRef)


        getAudioTracks(api, item, setVideoState);
        getSubtitles(api, item, setVideoState);


        videoElement.addEventListener("play", () => {
            setPlayerState(prev => ({
                ...prev,
                isPlaying: true
            }));
        });
        videoElement.addEventListener("pause", () => {
            setPlayerState(prev => ({
                ...prev,
                isPlaying: false
            }));
        });
        videoElement.addEventListener("durationchange", () => {
            setPlayerState(prev => ({
                ...prev,
                duration: videoElement.duration
            }));
        });
        videoElement.addEventListener("timeupdate", () => {
            setPlayerState(prev => ({
                ...prev,
                currentTime: videoElement.currentTime
            }));
        });
        videoElement.addEventListener("waiting", () => {
            setPlayerState(prev => ({
                ...prev,
                isLoading: true
            }));
        })
        videoElement.addEventListener("playing", () => {
            setPlayerState(prev => ({
                ...prev,
                isLoading: false
            }));
        })
        videoElement.addEventListener("canplay", () => {
            setPlayerState(prev => ({
                ...prev,
                isLoading: false
            }));
        })


        return () => {
            videoElement.removeEventListener("play", () => {
                setPlayerState(prev => ({
                    ...prev,
                    isPlaying: true
                }));
            });
            videoElement.removeEventListener("pause", () => {
                setPlayerState(prev => ({
                    ...prev,
                    isPlaying: false
                }));
            });
            videoElement.removeEventListener("durationchange", () => {
                setPlayerState(prev => ({
                    ...prev,
                    duration: videoElement.duration
                }));
            });
            videoElement.removeEventListener("timeupdate", () => {
                setPlayerState(prev => ({
                    ...prev,
                    currentTime: videoElement.currentTime
                }));
            });
            videoElement.removeEventListener("waiting", () => {
                setPlayerState(prev => ({
                    ...prev,
                    isLoading: true
                }));
            })
            videoElement.removeEventListener("playing", () => {
                setPlayerState(prev => ({
                    ...prev,
                    isLoading: false
                }));
            })
            videoElement.removeEventListener("canplay", () => {
                setPlayerState(prev => ({
                    ...prev,
                    isLoading: false
                }));
            })

            if (videoElement.__hlsInstance) {
                videoElement.__hlsInstance.destroy();
                videoElement.__hlsInstance = null;
            }
            if (hlsRef.current != null) {
                hlsRef.current.destroy();
            }
        }

    }, [api, item, restoreTimeAndPlay]);
    useEffect(() => {
        if (item == null || api == null || videoRef.current == null) return;

        const supportDirectPlay = isSupportedCodecVideo(item);

        if (playerState.currentTime != -1 && item.UserData?.PlaybackPositionTicks) {
            videoRef.current.currentTime = Math.floor(item.UserData.PlaybackPositionTicks / 10000000);
        } else {
            videoRef.current.currentTime = 0;
        }

        const playbackUrl = api.getPlaybackUrl(
            item.Id,
            videoState.selectedAudioTrack,
            videoState.subtitleTracks,
            videoState.selectedSubtitleIndex,
            supportDirectPlay,
            undefined
        )

        const playSessionId = `${api["deviceId"]}-${Date.now()}`;

        let resumeTime = 0;
        if (item.UserData.PlaybackPositionTicks) {
            resumeTime = Math.floor(item.UserData.PlaybackPositionTicks / 10000000);
        }

        api.reportPlaying?.({
            itemId: item.Id,
            mediaSourceId: item.Id,
            playSessionId,
            audioStreamIndex: videoState.selectedAudioTrack,
            subtitleStreamIndex: videoState.selectedSubtitleIndex ?? 0,
            positionTicks: Math.floor((resumeTime || 0) * 10000000),
            volumeLevel: 100,
            isMuted: false,
            isPaused: false,
            repeatMode: "RepeatNone",
            shuffleMode: "Sorted",
            maxStreamingBitrate: 140000000,
            playbackStartTimeTicks: Date.now() * 10000,
            playbackRate: 1,
            secondarySubtitleStreamIndex: -1,
            bufferedRanges: [],
            playMethod: supportDirectPlay ? "DirectPlay" : "Transcode",
            nowPlayingQueue: [{Id: item.Id, PlaylistItemId: "playlistItem0"}],
            canSeek: true,
        });


        if (hlsRef.current) {
            hlsRef.current.loadSource(playbackUrl)
        } else {
            videoRef.current.src = playbackUrl;
        }

        //videoRef.current.play();

    }, [item, api, videoState.selectedAudioTrack, videoState.subtitleTracks, videoState.selectedSubtitleIndex]);


    useEffect(() => {
        if (!api || !item) return
        if (!playerState.isPlaying) return;

        const position = Math.floor(playerState.currentTime)
        if (position !== playerState.lastReported && (position % 2 === 0 || position === Math.floor(playerState.duration))) {
            setPlayerState(prev => ({
                ...prev,
                lastReported: position
            }));

            api.reportPlaybackProgress(
                item.Id,
                position,
                videoState.selectedAudioTrack,
                (videoState.selectedSubtitleIndex ?? 0)
            )

        }


    }, [api, item, playerState.isPlaying, playerState.currentTime, playerState.lastReported, playerState.duration, videoState.selectedAudioTrack, videoState.selectedSubtitleIndex]);


    return (
        <div
            ref={playerContainerRef}
            className="relative w-full h-screen bg-black text-white overflow-hidden"
            onClick={handleUserInput}
            onMouseMove={handleUserInput}
        >
            <video
                className="w-full h-full"
                autoPlay
                ref={videoRef}>
            </video>


            {videoState.selectedSubtitleIndex !== null && item !== null && (
                <SubtitleTrack
                    subtitleTracks={videoState.subtitleTracks}
                    selectedSubtitleIndex={videoState.selectedSubtitleIndex}
                    itemId={item.Id}
                    currentTime={playerState.currentTime}
                />
            )}

            <div
                role="button"
                tabIndex={0}
                className={clsx(
                    "absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 transition-opacity duration-300 select-none cursor-default",
                    playerState.showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onDoubleClick={toggleFullscreen}
            >

                <div className="absolute top-0 left-0 right-0 p-4 flex items-center z-20">
                    <button
                        //onClick={() => handleBack()}
                        className="flex items-center gap-2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition-colors"
                    >
                        <ArrowLeft size={20}/>
                    </button>
                    <h1 className="text-xl font-medium text-white ml-3 truncate">
                        {item?.Name}
                    </h1>
                </div>


                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 z-20">
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm">{formatTime(playerState.currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={playerState.duration || 0}
                            value={playerState.currentTime}
                            onChange={handleProgressChange}
                            className="video-progress w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                            style={{
                                ...(playerState.duration
                                    ? ({
                                        "--progress": `${(playerState.currentTime / playerState.duration) * 100}%`,
                                    } as React.CSSProperties)
                                    : {}),
                            }}
                        />
                        <span className="text-sm">{formatTime(playerState.duration)}</span>
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                            <button
                                //onClick={() => skip(-10)}
                                className="text-white hover:text-gray-300 transition-colors"
                            >
                                <ChevronsLeft size={26}/>
                            </button>
                            {
                                playerState.isLoading ? (
                                    <Loader2 size={22} className="animate-spin"/>
                                ) : (
                                    <button
                                        onClick={togglePlay}
                                        className="text-white hover:text-gray-300 transition-colors"
                                    >
                                        {playerState.isPlaying ? <Pause size={22}/> : <Play size={22}/>}
                                    </button>
                                )
                            }

                            <button
                                //onClick={() => skip(10)}
                                className="text-white hover:text-gray-300 transition-colors"
                            >
                                <ChevronsRight size={24}/>
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    //onClick={toggleMute}
                                    className="text-white hover:text-gray-300 transition-colors"
                                >
                                    {(() => {
                                        let volumeIcon;
                                        if (playerState.isMuted) {
                                            volumeIcon = <VolumeX size={24}/>;
                                        } else if (playerState.volume > 0.5) {
                                            volumeIcon = <Volume2 size={24}/>;
                                        } else {
                                            volumeIcon = <Volume1 size={24}/>;
                                        }
                                        return volumeIcon;
                                    })()}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    //value={playerState.volume}
                                    //onChange={handleVolumeChange}
                                    className="volume-slider w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                                    style={{
                                        ...(typeof playerState.volume === "number"
                                            ? ({
                                                "--volume-progress": `${playerState.volume * 100}%`,
                                            } as React.CSSProperties)
                                            : {}),
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                            <TracksMenu
                                audioTracks={videoState.audioTracks}
                                selectedAudioTrack={videoState.selectedAudioTrack}
                                setSelectedAudioTrack={updateAudioTrack}
                                subtitleTracks={videoState.subtitleTracks}
                                selectedSubtitleIndex={videoState.selectedSubtitleIndex}
                                setSelectedSubtitleIndex={updateSubtitleIndex}
                                isOpen={playerState.tracksMenuOpen}
                                setIsOpen={setTrackOpen}
                                maxRes={1080}
                                selectedRes={undefined}
                                setResolution={() => {
                                }}
                            />

                            <button
                                onClick={toggleFullscreen}
                                className="text-white hover:text-gray-300 transition-colors"
                            >
                                {playerState.isFullscreen ? <Minimize size={24}/> : <Maximize size={24}/>}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )


}

export default PlayerContainer;