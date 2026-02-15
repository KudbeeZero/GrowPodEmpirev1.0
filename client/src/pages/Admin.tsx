import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Video, Upload, Loader2, Shield, AlertTriangle, Sparkles, Plus, Leaf, Trash2 } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAlgorand } from "@/hooks/use-algorand";
import type { AnnouncementVideo, SeedBankItem } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const { account } = useAlgorand();
  const address = account;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const titleRef = useRef<string>("");
  const pendingUploadPath = useRef<string | null>(null);
  
  // Seed creation state
  const [seedName, setSeedName] = useState("");
  const [seedDescription, setSeedDescription] = useState("");
  const [seedRarity, setSeedRarity] = useState("common");
  const [seedTerpenes, setSeedTerpenes] = useState("");
  const [seedEffects, setSeedEffects] = useState("");
  const [seedFlavors, setSeedFlavors] = useState("");
  const [seedThc, setSeedThc] = useState("15-20%");
  const [seedCbd, setSeedCbd] = useState("0-1%");
  const [seedPrice, setSeedPrice] = useState("1000");
  const [seedGlowColor, setSeedGlowColor] = useState("#a855f7");
  const [seedSupply, setSeedSupply] = useState("");
  const [seedGrowthBonus, setSeedGrowthBonus] = useState("0");

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

  const { data: seeds = [], isLoading: loadingSeeds } = useQuery<SeedBankItem[]>({
    queryKey: ["/api/seed-bank"],
    enabled: isAdminData?.isAdmin,
  });

  const createSeedMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/seed-bank", {
        walletAddress: address,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seed-bank"] });
      toast({ title: "Seed created!", description: "The new seed is now available in the Seed Bank." });
      setSeedDialogOpen(false);
      resetSeedForm();
    },
    onError: (err: any) => {
      toast({ title: "Failed to create seed", description: err.message, variant: "destructive" });
    },
  });

  const deleteSeedMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/seed-bank/${id}`, { walletAddress: address });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seed-bank"] });
      toast({ title: "Seed deleted" });
    },
  });

  const resetSeedForm = () => {
    setSeedName("");
    setSeedDescription("");
    setSeedRarity("common");
    setSeedTerpenes("");
    setSeedEffects("");
    setSeedFlavors("");
    setSeedThc("15-20%");
    setSeedCbd("0-1%");
    setSeedPrice("1000");
    setSeedGlowColor("#a855f7");
    setSeedSupply("");
    setSeedGrowthBonus("0");
  };

  const handleCreateSeed = () => {
    if (!seedName || !seedDescription) {
      toast({ title: "Missing fields", description: "Name and description are required", variant: "destructive" });
      return;
    }
    
    createSeedMutation.mutate({
      name: seedName,
      description: seedDescription,
      rarity: seedRarity,
      terpeneProfile: seedTerpenes.split(",").map(s => s.trim()).filter(Boolean),
      effects: seedEffects.split(",").map(s => s.trim()).filter(Boolean),
      flavorNotes: seedFlavors.split(",").map(s => s.trim()).filter(Boolean),
      thcRange: seedThc,
      cbdRange: seedCbd,
      budPrice: seedPrice,
      glowColor: seedGlowColor,
      totalSupply: seedSupply ? parseInt(seedSupply) : null,
      growthBonus: parseInt(seedGrowthBonus) || 0,
    });
  };

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

  const handleGetUploadParameters = async (file: { name: string; type: string; size?: number | null }) => {
    const res = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        contentType: file.type,
        size: file.size || 0,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to get upload URL");
    }

    const data = await res.json();
    pendingUploadPath.current = data.objectPath;

    return {
      method: "PUT" as const,
      url: data.uploadURL,
      headers: { "Content-Type": file.type },
    };
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    titleRef.current = value;
  };

  const handleUploadComplete = () => {
    const currentTitle = titleRef.current.trim();
    if (pendingUploadPath.current && currentTitle) {
      createAnnouncementMutation.mutate({
        title: currentTitle,
        objectPath: pendingUploadPath.current,
      });
    } else if (!currentTitle) {
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

      <div className="grid gap-6 lg:grid-cols-2">
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
                      onChange={handleTitleChange}
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

        <Card className="border-pink-500/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-400" />
              Seed Bank
            </CardTitle>
            <Dialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600" data-testid="button-add-seed">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Seed
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Seed</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={seedName}
                        onChange={(e) => setSeedName(e.target.value)}
                        placeholder="Purple Diddy Punch"
                        data-testid="input-seed-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rarity</Label>
                      <Select value={seedRarity} onValueChange={setSeedRarity}>
                        <SelectTrigger data-testid="select-seed-rarity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="common">Common</SelectItem>
                          <SelectItem value="uncommon">Uncommon</SelectItem>
                          <SelectItem value="rare">Rare</SelectItem>
                          <SelectItem value="legendary">Legendary</SelectItem>
                          <SelectItem value="mythic">Mythic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={seedDescription}
                      onChange={(e) => setSeedDescription(e.target.value)}
                      placeholder="A legendary strain with intense purple hues..."
                      data-testid="input-seed-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Terpenes (comma-separated)</Label>
                    <Input
                      value={seedTerpenes}
                      onChange={(e) => setSeedTerpenes(e.target.value)}
                      placeholder="Myrcene, Limonene, Caryophyllene"
                      data-testid="input-seed-terpenes"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Effects (comma-separated)</Label>
                    <Input
                      value={seedEffects}
                      onChange={(e) => setSeedEffects(e.target.value)}
                      placeholder="Euphoric, Creative, Relaxed"
                      data-testid="input-seed-effects"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Flavor Notes (comma-separated)</Label>
                    <Input
                      value={seedFlavors}
                      onChange={(e) => setSeedFlavors(e.target.value)}
                      placeholder="Grape, Berry, Sweet"
                      data-testid="input-seed-flavors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>THC Range</Label>
                      <Input
                        value={seedThc}
                        onChange={(e) => setSeedThc(e.target.value)}
                        placeholder="20-25%"
                        data-testid="input-seed-thc"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CBD Range</Label>
                      <Input
                        value={seedCbd}
                        onChange={(e) => setSeedCbd(e.target.value)}
                        placeholder="0-1%"
                        data-testid="input-seed-cbd"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price ($BUD)</Label>
                      <Input
                        type="number"
                        value={seedPrice}
                        onChange={(e) => setSeedPrice(e.target.value)}
                        placeholder="1000"
                        data-testid="input-seed-price"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Supply (blank = unlimited)</Label>
                      <Input
                        type="number"
                        value={seedSupply}
                        onChange={(e) => setSeedSupply(e.target.value)}
                        placeholder="100"
                        data-testid="input-seed-supply"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Glow Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={seedGlowColor}
                          onChange={(e) => setSeedGlowColor(e.target.value)}
                          className="w-12 h-9 p-1 cursor-pointer"
                          data-testid="input-seed-color"
                        />
                        <Input
                          value={seedGlowColor}
                          onChange={(e) => setSeedGlowColor(e.target.value)}
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Growth Bonus %</Label>
                      <Input
                        type="number"
                        value={seedGrowthBonus}
                        onChange={(e) => setSeedGrowthBonus(e.target.value)}
                        placeholder="0"
                        data-testid="input-seed-bonus"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    onClick={handleCreateSeed}
                    disabled={createSeedMutation.isPending}
                    data-testid="button-create-seed"
                  >
                    {createSeedMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create Seed
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loadingSeeds ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : seeds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Leaf className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No seeds in the bank yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {seeds.map((seed) => (
                  <div
                    key={seed.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                    style={{ borderColor: `${seed.glowColor}40` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${seed.glowColor}30` }}
                      >
                        <Leaf className="h-4 w-4" style={{ color: seed.glowColor || "#a855f7" }} />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: seed.glowColor || undefined }}>
                          {seed.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {seed.rarity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {seed.mintedCount}{seed.totalSupply ? `/${seed.totalSupply}` : ""} minted
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteSeedMutation.mutate(seed.id)}
                      disabled={deleteSeedMutation.isPending}
                      data-testid={`button-delete-seed-${seed.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
