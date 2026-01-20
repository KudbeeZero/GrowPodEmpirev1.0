import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Video, Upload, Loader2, Shield, AlertTriangle } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAlgorand } from "@/hooks/use-algorand";
import type { AnnouncementVideo } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const { account } = useAlgorand();
  const address = account;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const pendingUploadPath = useRef<string | null>(null);

  const { data: isAdminData, isLoading: checkingAdmin } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/announcement/admin-check", address],
    queryFn: async () => {
      if (!address) return { isAdmin: false };
      const res = await fetch(`/api/announcement/admin-check/${address}`);
      return res.json();
    },
    enabled: !!address,
  });

  const { data: currentAnnouncement, isLoading: loadingAnnouncement } = useQuery<AnnouncementVideo | null>({
    queryKey: ["/api/announcement/current"],
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; objectPath: string }) => {
      return apiRequest("POST", "/api/announcement", {
        walletAddress: address,
        title: data.title,
        objectPath: data.objectPath,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcement/current"] });
      toast({
        title: "Announcement uploaded",
        description: "The video will be shown to all users on their next visit.",
      });
      setDialogOpen(false);
      setTitle("");
      pendingUploadPath.current = null;
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async (file: { name: string; type: string }) => {
    const res = await fetch("/objects/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        directory: ".private/announcements",
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to get upload URL");
    }

    const data = await res.json();
    pendingUploadPath.current = data.objectPath;

    return {
      method: "PUT" as const,
      url: data.signedUrl,
      headers: { "Content-Type": file.type },
    };
  };

  const handleUploadComplete = () => {
    if (pendingUploadPath.current && title.trim()) {
      createAnnouncementMutation.mutate({
        title: title.trim(),
        objectPath: pendingUploadPath.current,
      });
    } else if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for the announcement.",
        variant: "destructive",
      });
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen py-8 px-4 container mx-auto">
        <Card className="max-w-md mx-auto border-yellow-500/30">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-display font-bold mb-2">Connect Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkingAdmin) {
    return (
      <div className="min-h-screen py-8 px-4 container mx-auto flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdminData?.isAdmin) {
    return (
      <div className="min-h-screen py-8 px-4 container mx-auto">
        <Card className="max-w-md mx-auto border-destructive/30">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-display font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 container mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <Shield className="h-8 w-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage announcements and settings</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-400" />
              Announcement Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Upload a video that all users must watch once before accessing the app.
              When you upload a new video, it replaces the current one.
            </p>

            {loadingAnnouncement ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : currentAnnouncement ? (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="font-medium">Current: {currentAnnouncement.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Uploaded {new Date(currentAnnouncement.createdAt!).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-muted-foreground">No announcement video set</p>
              </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Video
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Announcement Video</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-title">Title</Label>
                    <Input
                      id="video-title"
                      placeholder="e.g., Welcome to GrowPod Empire"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      data-testid="input-video-title"
                    />
                  </div>

                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={104857600}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Select Video File
                  </ObjectUploader>

                  <p className="text-xs text-muted-foreground text-center">
                    Supported formats: MP4, WebM, MOV (max 100MB)
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
