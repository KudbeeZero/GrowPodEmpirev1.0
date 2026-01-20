import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { AnnouncementVideo } from "@shared/schema";

interface AnnouncementModalProps {
  announcement: AnnouncementVideo;
  onComplete: () => void;
}

export function AnnouncementModal({ announcement, onComplete }: AnnouncementModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // The objectPath is already in the format "/objects/uploads/uuid" 
    // which can be used directly as the video source
    if (announcement.objectPath) {
      // If path already starts with /objects/, use it directly
      // Otherwise, prepend /objects/
      const path = announcement.objectPath.startsWith("/objects/")
        ? announcement.objectPath
        : `/objects/${announcement.objectPath}`;
      setVideoUrl(path);
      setIsLoading(false);
    }
  }, [announcement.objectPath]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      setVideoEnded(true);
    };

    const handleTimeUpdate = () => {
      setProgress(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      video.play().catch(() => {});
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [videoUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
        data-testid="announcement-modal"
      >
        <div className="w-full max-w-4xl px-4">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-3xl font-display font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            {announcement.title}
          </motion.h2>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative rounded-xl overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20"
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full aspect-video bg-black"
                controls
                playsInline
                data-testid="announcement-video"
              />
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/70 font-mono">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            {videoEnded ? (
              <Button
                size="lg"
                onClick={onComplete}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-lg px-8"
                data-testid="button-continue"
              >
                <X className="h-5 w-5 mr-2" />
                Continue to GrowPod Empire
              </Button>
            ) : (
              <p className="text-muted-foreground text-sm">
                Please watch the entire video to continue
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
