import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Upload,
  Trash2,
  Loader2,
  Disc3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Song } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { parseBlob } from "music-metadata-browser";

function AudioVisualizer({ 
  isPlaying, 
  audioRef 
}: { 
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!canvas || !ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, width, height);

      if (analyzerRef.current && isPlaying) {
        const bufferLength = analyzerRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyzerRef.current.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.8;

          const hue = (i / bufferLength) * 120 + 180;
          ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;

          ctx.fillRect(x, height - barHeight, barWidth, barHeight);

          ctx.shadowBlur = 15;
          ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.5)`;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
          ctx.shadowBlur = 0;

          x += barWidth + 1;
        }
      } else {
        const bars = 32;
        const barWidth = width / bars - 2;

        for (let i = 0; i < bars; i++) {
          const x = i * (barWidth + 2);
          const amplitude = Math.sin(Date.now() * 0.002 + i * 0.3) * 0.5 + 0.5;
          const barHeight = amplitude * height * 0.3 + 10;

          const hue = (i / bars) * 120 + 180;
          ctx.fillStyle = `hsla(${hue}, 80%, 40%, 0.4)`;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setupAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaElementSource(audio);
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 128;
        source.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContextRef.current.destination);
      }
    };

    audio.addEventListener("play", setupAudio);

    return () => {
      audio.removeEventListener("play", setupAudio);
    };
  }, [audioRef]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={200}
      className="w-full h-40 rounded-lg bg-black/50"
      data-testid="audio-visualizer"
    />
  );
}

function SongListItem({ 
  song, 
  isActive, 
  onPlay,
  onDelete
}: { 
  song: Song; 
  isActive: boolean;
  onPlay: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all",
        isActive 
          ? "bg-primary/20 border border-primary/30" 
          : "bg-card/50 border border-transparent hover:bg-card hover:border-white/10"
      )}
      onClick={onPlay}
      data-testid={`song-item-${song.id}`}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
        isActive ? "bg-primary/30" : "bg-muted/30"
      )}>
        {isActive ? (
          <Disc3 className="h-5 w-5 text-primary animate-spin" style={{ animationDuration: "3s" }} />
        ) : (
          <Music className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate",
          isActive ? "text-primary" : ""
        )}>
          {song.title}
        </p>
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground font-mono">
          {song.playCount} plays
        </span>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          data-testid={`delete-song-${song.id}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function Jukebox() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingUploadPath = useRef<string>("");
  const isSeeking = useRef(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState("");
  const [newSongArtist, setNewSongArtist] = useState("");
  const [uploadedPath, setUploadedPath] = useState("");

  const { data: songs = [], isLoading } = useQuery<Song[]>({
    queryKey: ["/api/jukebox/songs"],
    staleTime: 30000,
  });

  const playMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/jukebox/songs/${id}/play`);
    },
  });

  const addSongMutation = useMutation({
    mutationFn: async (data: { title: string; artist: string; objectPath: string }) => {
      return await apiRequest("POST", "/api/jukebox/songs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jukebox/songs"] });
      setAddDialogOpen(false);
      setNewSongTitle("");
      setNewSongArtist("");
      setUploadedPath("");
      toast({ title: "Song added to the jukebox!" });
    },
    onError: () => {
      toast({ title: "Failed to add song", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/jukebox/songs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jukebox/songs"] });
      toast({ title: "Song removed from jukebox" });
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
      // Don't update progress if user is actively seeking
      if (!isSeeking.current) {
        setProgress(audio.currentTime);
      }
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
    const loadAudio = async () => {
      if (currentSong && audioRef.current) {
        // The objectPath is already the full path to the object (e.g., "/objects/...")
        // Set it directly as the audio source
        audioRef.current.src = currentSong.objectPath;
        if (isPlaying) {
          audioRef.current.play().catch(() => {});
        }
      }
    };
    loadAudio();
  }, [currentSong?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeekStart = () => {
    isSeeking.current = true;
  };

  const handleSeekChange = (value: number[]) => {
    // Update visual progress during dragging
    setProgress(value[0]);
  };

  const handleSeekEnd = (value: number[]) => {
    // Actually seek audio when user releases
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
    }
    isSeeking.current = false;
  };

  return (
    <div className="min-h-screen py-8 px-4 container mx-auto">
      <audio ref={audioRef} />

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 p-4 rounded-xl">
          <Music className="h-10 w-10 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            GrowPod Jukebox
          </h1>
          <p className="text-muted-foreground">Vibes for your grow room</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-purple-500/20 overflow-hidden">
          <CardContent className="pt-6 space-y-6">
            <AudioVisualizer isPlaying={isPlaying} audioRef={audioRef} />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSong?.id || "none"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                {currentSong ? (
                  <>
                    <h2 className="text-2xl font-display font-bold text-primary">
                      {currentSong.title}
                    </h2>
                    <p className="text-muted-foreground">{currentSong.artist}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No song selected</p>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="space-y-2">
              <Slider
                value={[progress]}
                max={duration || 100}
                step={0.1}
                onPointerDown={handleSeekStart}
                onValueChange={handleSeekChange}
                onValueCommit={handleSeekEnd}
                className="cursor-pointer"
                data-testid="progress-slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                size="icon"
                variant={shuffle ? "default" : "ghost"}
                onClick={() => setShuffle(!shuffle)}
                data-testid="button-shuffle"
              >
                <Shuffle className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={playPrevious}
                disabled={songs.length === 0}
                data-testid="button-previous"
              >
                <SkipBack className="h-6 w-6" />
              </Button>

              <Button
                size="lg"
                className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                onClick={togglePlay}
                disabled={songs.length === 0}
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={playNext}
                disabled={songs.length === 0}
                data-testid="button-next"
              >
                <SkipForward className="h-6 w-6" />
              </Button>

              <Button
                size="icon"
                variant={repeat ? "default" : "ghost"}
                onClick={() => setRepeat(!repeat)}
                data-testid="button-repeat"
              >
                <Repeat className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3 max-w-xs mx-auto">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsMuted(!isMuted)}
                data-testid="button-mute"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={(v) => {
                  const newVolume = v[0] / 100;
                  setVolume(newVolume);
                  // Unmute when user adjusts volume slider
                  if (isMuted && newVolume > 0) {
                    setIsMuted(false);
                  }
                }}
                className="flex-1"
                data-testid="volume-slider"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-display text-lg">Playlist</CardTitle>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2" data-testid="button-add-song">
                  <Upload className="h-4 w-4" />
                  Add Song
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Song to Jukebox</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Song Title</Label>
                    <Input
                      id="title"
                      value={newSongTitle}
                      onChange={(e) => setNewSongTitle(e.target.value)}
                      placeholder="Enter song title"
                      data-testid="input-song-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist">Artist</Label>
                    <Input
                      id="artist"
                      value={newSongArtist}
                      onChange={(e) => setNewSongArtist(e.target.value)}
                      placeholder="Enter artist name"
                      data-testid="input-song-artist"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Audio File</Label>
                    {uploadedPath ? (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Music className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground truncate">
                          File uploaded successfully
                        </span>
                      </div>
                    ) : (
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={52428800}
                        onFileAdded={async (file) => {
                          try {
                            const metadata = await parseBlob(file);
                            const title = metadata.common.title || file.name.replace(/\.[^/.]+$/, "");
                            const artist = metadata.common.artist || "Unknown Artist";
                            setNewSongTitle(title);
                            setNewSongArtist(artist);
                          } catch {
                            // Fallback to filename if metadata extraction fails
                            setNewSongTitle(file.name.replace(/\.[^/.]+$/, ""));
                          }
                        }}
                        onGetUploadParameters={async (file) => {
                          const res = await fetch("/api/uploads/request-url", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: file.name,
                              size: file.size,
                              contentType: file.type,
                            }),
                          });
                          const { uploadURL, objectPath } = await res.json();
                          // Store path in ref - don't set state yet (upload not complete)
                          pendingUploadPath.current = objectPath;
                          return {
                            method: "PUT",
                            url: uploadURL,
                            headers: { "Content-Type": file.type },
                          };
                        }}
                        onComplete={() => {
                          // Now upload is complete, set the state
                          setUploadedPath(pendingUploadPath.current);
                          toast({ title: "Audio file uploaded!" });
                        }}
                        buttonClassName="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Audio File
                      </ObjectUploader>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    disabled={!newSongTitle || !newSongArtist || !uploadedPath || addSongMutation.isPending}
                    onClick={() => {
                      addSongMutation.mutate({
                        title: newSongTitle,
                        artist: newSongArtist,
                        objectPath: uploadedPath,
                      });
                    }}
                    data-testid="button-save-song"
                  >
                    {addSongMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add to Jukebox"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : songs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No songs yet</p>
                <p className="text-sm mt-1">Upload your first track!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {songs.map((song, idx) => (
                  <SongListItem
                    key={song.id}
                    song={song}
                    isActive={idx === currentSongIndex}
                    onPlay={() => playSong(idx)}
                    onDelete={() => deleteMutation.mutate(song.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-cyan-500/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
              <span>AI-generated music only</span>
            </div>
            <span className="text-white/20">|</span>
            <span>Perfect vibes for cultivation sessions</span>
            <span className="text-white/20">|</span>
            <span>No copyright worries</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
