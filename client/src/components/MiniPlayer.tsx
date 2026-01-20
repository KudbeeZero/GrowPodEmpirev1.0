import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Shuffle,
  Repeat,
  X,
  ChevronLeft,
  Disc3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Song } from "@shared/schema";

export function MiniPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const { data: songs = [] } = useQuery<Song[]>({
    queryKey: ["/api/jukebox/songs"],
    staleTime: 30000,
  });

  const playMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/jukebox/songs/${id}/play`);
    },
  });

  const currentSong = songs[currentSongIndex];

  const playSong = useCallback((index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
    if (songs[index]) {
      playMutation.mutate(songs[index].id);
    }
  }, [songs, playMutation]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const playNext = useCallback(() => {
    if (songs.length === 0) return;
    
    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else {
      nextIndex = (currentSongIndex + 1) % songs.length;
    }
    playSong(nextIndex);
  }, [songs.length, shuffle, currentSongIndex, playSong]);

  const playPrevious = useCallback(() => {
    if (songs.length === 0) return;
    
    const prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    playSong(prevIndex);
  }, [songs.length, currentSongIndex, playSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", updateProgress);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", updateProgress);
    };
  }, [repeat, playNext]);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.objectPath;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentSong?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  if (songs.length === 0) return null;

  return (
    <>
      <audio ref={audioRef} />

      {/* Floating toggle button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed right-4 bottom-20 z-50 w-14 h-14 rounded-full",
              "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30",
              "flex items-center justify-center",
              "hover:scale-105 active:scale-95 transition-transform"
            )}
            data-testid="button-open-miniplayer"
          >
            {isPlaying ? (
              <Disc3 className="h-6 w-6 text-white animate-spin" style={{ animationDuration: "3s" }} />
            ) : (
              <Music className="h-6 w-6 text-white" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-out panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[90vw]",
                "bg-background/95 backdrop-blur-xl border-l border-purple-500/20",
                "flex flex-col shadow-2xl shadow-purple-500/10"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 p-2 rounded-lg">
                    <Music className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="font-display font-bold text-purple-400">Jukebox</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  data-testid="button-close-miniplayer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Current song */}
              <div className="p-4 border-b border-white/10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSong?.id || "none"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center"
                  >
                    <h3 className="font-display font-bold text-lg text-primary truncate">
                      {currentSong?.title || "No song"}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {currentSong?.artist || "Unknown artist"}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress */}
                <div className="mt-4 space-y-2">
                  <Slider
                    value={[progress]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    size="icon"
                    variant={shuffle ? "default" : "ghost"}
                    onClick={() => setShuffle(!shuffle)}
                    className="h-9 w-9"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={playPrevious}
                    className="h-9 w-9"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    size="lg"
                    className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={togglePlay}
                    data-testid="miniplayer-play-pause"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={playNext}
                    className="h-9 w-9"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant={repeat ? "default" : "ghost"}
                    onClick={() => setRepeat(!repeat)}
                    className="h-9 w-9"
                  >
                    <Repeat className="h-4 w-4" />
                  </Button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsMuted(!isMuted)}
                    className="h-8 w-8 shrink-0"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(v) => setVolume(v[0] / 100)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Song list */}
              <div className="flex-1 overflow-y-auto p-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
                  Playlist
                </p>
                <div className="space-y-1">
                  {songs.map((song, idx) => (
                    <button
                      key={song.id}
                      onClick={() => playSong(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                        idx === currentSongIndex
                          ? "bg-primary/20 border border-primary/30"
                          : "hover:bg-white/5"
                      )}
                      data-testid={`miniplayer-song-${song.id}`}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        idx === currentSongIndex ? "bg-primary/30" : "bg-muted/30"
                      )}>
                        {idx === currentSongIndex && isPlaying ? (
                          <Disc3 className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: "3s" }} />
                        ) : (
                          <Music className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          idx === currentSongIndex ? "text-primary" : ""
                        )}>
                          {song.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
