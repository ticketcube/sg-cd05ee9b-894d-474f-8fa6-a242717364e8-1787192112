
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CubeViewer } from "@/components/3d/CubeViewer";
import { useCube, CubeFace } from "@/contexts/CubeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Image as ImageIcon, Type, Trash2, Eye, Save, Lock, LogIn } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Head from "next/head";
import { PricingModal } from "@/components/pricing/PricingModal";
import AuthDialog from "@/components/AuthDialog";

interface FaceFormData {
  title: string;
  contentType: "image" | "text";
  text: string;
  imageFile: File | null;
  imagePreview: string | null;
}

// Component for rendering when user is not authenticated
function AuthRequiredContent({ onSignIn }: { onSignIn: () => void }) {
  return (
    <>
      <Head>
        <title>Create Your TicketCube™ - Interactive 3D Collectible</title>
        <meta name="description" content="Create your own custom TicketCube™ with images and text. A unique 3D digital collectible." />
      </Head>
      <main className="container mx-auto min-h-screen pt-8 px-4 md:px-6 lg:px-8 max-w-[2000px]">
        <section className="text-center mb-8 animate-fade-up">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-gradient-to-br from-neutral-900 to-neutral-600 bg-clip-text text-transparent dark:from-white dark:to-neutral-300">
            Create Your TicketCube™
          </h1>
          <p className="text-xl text-muted-foreground mt-4 max-w-[800px] mx-auto">
            Design a unique 3D digital collectible with your own images and text. Customize up to 5 faces with your memories, artwork, or messages.
          </p>
        </section>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800 border-neutral-200/60">
            <CardContent className="pt-16 pb-16 text-center">
              <div className="mb-6">
                <LogIn className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
                <p className="text-muted-foreground mb-6">
                  Please sign in to create and customize your TicketCube™. Your cubes will be securely saved to your account.
                </p>
              </div>
              
              <Button
                onClick={onSignIn}
                className="bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-neutral-900 hover:to-black"
                size="lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In to Continue
              </Button>
              
              <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
                <h3 className="font-semibold mb-3">What you can do with TicketCube™:</h3>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Customize up to 5 faces with images or text</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Interactive 3D preview with rotation and zoom</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Secure your cube with blockchain minting options</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Share and gift cubes to friends</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

export default function TicketCubePage() {
  // All hooks are now at the top level
  const { user, loading: authLoading } = useAuth();
  const { cubeData, setCubeData, setPreviewMode, isPreviewMode, resetCube, saveCube, isLoading } = useCube();
  
  const [cubeTitle, setCubeTitle] = useState("My Custom TicketCube");
  const [cubeDescription, setCubeDescription] = useState("");
  const [faces, setFaces] = useState<Record<number, FaceFormData>>({
    1: { title: "Face 1", contentType: "text", text: "", imageFile: null, imagePreview: null },
    2: { title: "Face 2", contentType: "text", text: "", imageFile: null, imagePreview: null },
    3: { title: "Face 3", contentType: "text", text: "", imageFile: null, imagePreview: null },
    4: { title: "Face 4", contentType: "text", text: "", imageFile: null, imagePreview: null },
    5: { title: "Face 5", contentType: "text", text: "", imageFile: null, imagePreview: null },
  });
  
  const [activeTab, setActiveTab] = useState("1");
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedCubeId, setSelectedCubeId] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Conditional returns are now after all hook calls
  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <>
        <AuthDialog 
          isOpen={showAuthDialog} 
          onClose={() => setShowAuthDialog(false)} 
        />
        <AuthRequiredContent onSignIn={() => setShowAuthDialog(true)} />
      </>
    );
  }

  // All handler functions are defined within the component that can use the hooks
  const updateFace = (faceNumber: number, updates: Partial<FaceFormData>) => {
    setFaces(prev => ({
      ...prev,
      [faceNumber]: { ...prev[faceNumber], ...updates }
    }));
  };

  const handleImageUpload = (faceNumber: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive", 
        title: "File too large",
        description: "Please select an image under 5MB"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      updateFace(faceNumber, {
        imageFile: file,
        imagePreview: e.target?.result as string,
        contentType: "image"
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFaceContent = (faceNumber: number) => {
    updateFace(faceNumber, {
      text: "",
      imageFile: null,
      imagePreview: null,
      contentType: "text"
    });
    if (fileInputRefs.current[faceNumber]) {
      fileInputRefs.current[faceNumber]!.value = "";
    }
  };

  const handleViewCube = async () => {
    if (!isAnyFacePopulated()) {
      toast({
        variant: "destructive",
        title: "No content added",
        description: "Please add content to at least one face before viewing the cube"
      });
      return;
    }

    const cubeFaces: CubeFace[] = Object.entries(faces).map(([faceNum, face]) => ({
      id: `face-${faceNum}`,
      number: parseInt(faceNum),
      title: face.title,
      contentType: face.contentType,
      text: face.text || undefined,
      image: {
        file: face.imageFile || undefined,
        preview: face.imagePreview || undefined
      }
    }));

    cubeFaces.push({
      id: "face-6",
      number: 6,
      title: "OTWChart",
      contentType: "text",
      text: "Powered by OTWChart",
      image: {}
    });

    await setCubeData({
      type: "standard",
      title: cubeTitle,
      description: cubeDescription,
      faces: cubeFaces
    });

    setPreviewMode(true);
    toast({
      title: "Cube Generated!",
      description: "Your custom TicketCube has been created. Drag to rotate and scroll to zoom."
    });
  };

  const handleSecureCube = async () => {
    if (!cubeData) {
      toast({
        variant: "destructive",
        title: "No Cube Data",
        description: "Please create a cube before securing it."
      });
      return;
    }
    
    try {
      const cubeId = await saveCube();
      if (cubeId) {
        toast({
          title: "Cube Saved!",
          description: "Now, choose a plan to secure your cube."
        });
        setSelectedCubeId(cubeId);
        setIsPricingModalOpen(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save your cube. Please try again."
      });
    }
  };

  const handleReset = () => {
    resetCube();
    setFaces({
      1: { title: "Face 1", contentType: "text", text: "", imageFile: null, imagePreview: null },
      2: { title: "Face 2", contentType: "text", text: "", imageFile: null, imagePreview: null },
      3: { title: "Face 3", contentType: "text", text: "", imageFile: null, imagePreview: null },
      4: { title: "Face 4", contentType: "text", text: "", imageFile: null, imagePreview: null },
      5: { title: "Face 5", contentType: "text", text: "", imageFile: null, imagePreview: null },
    });
    setCubeTitle("My Custom TicketCube");
    setCubeDescription("");
    setActiveTab("1");
    toast({
      title: "Cube Reset",
      description: "Your cube has been reset to start fresh."
    });
  };

  const isAnyFacePopulated = () => {
    return Object.values(faces).some(face => 
      face.text.trim() !== "" || face.imageFile !== null
    );
  };

  const getPopulatedFacesCount = () => {
    return Object.values(faces).filter(face => 
      face.text.trim() !== "" || face.imageFile !== null
    ).length;
  };
  
  // Main authenticated content
  return (
    <>
      <Head>
        <title>Create Your TicketCube™ - Interactive 3D Collectible</title>
        <meta name="description" content="Create your own custom TicketCube™ with images and text. A unique 3D digital collectible." />
      </Head>
      
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        cubeId={selectedCubeId}
      />

      <main className="container mx-auto min-h-screen pt-8 px-4 md:px-6 lg:px-8 max-w-[2000px]">
        <section className="text-center mb-8 animate-fade-up">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-gradient-to-br from-neutral-900 to-neutral-600 bg-clip-text text-transparent dark:from-white dark:to-neutral-300">
            Create Your TicketCube™
          </h1>
          <p className="text-xl text-muted-foreground mt-4 max-w-[800px] mx-auto">
            Design a unique 3D digital collectible with your own images and text. Customize up to 5 faces with your memories, artwork, or messages.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge variant="outline" className="text-sm">
              {getPopulatedFacesCount()}/5 Faces Complete
            </Badge>
            {isPreviewMode && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                Preview Active
              </Badge>
            )}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2 mb-16">
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800 border-neutral-200/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Cube Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Cube Title</label>
                  <Input
                    value={cubeTitle}
                    onChange={(e) => setCubeTitle(e.target.value)}
                    placeholder="My Custom TicketCube"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    value={cubeDescription}
                    onChange={(e) => setCubeDescription(e.target.value)}
                    placeholder="Describe your cube..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800 border-neutral-200/60">
              <CardHeader>
                <CardTitle>Customize Faces (1-5)</CardTitle>
                <p className="text-sm text-muted-foreground">Face 6 will be automatically populated with OTWChart branding</p>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5 mb-4">
                    {[1,2,3,4,5].map(num => (
                      <TabsTrigger key={num} value={num.toString()} className="relative">
                        Face {num}
                        {(faces[num].text.trim() || faces[num].imageFile) && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></div>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {[1,2,3,4,5].map(faceNum => (
                    <TabsContent key={faceNum} value={faceNum.toString()} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Face Title</label>
                        <Input
                          value={faces[faceNum].title}
                          onChange={(e) => updateFace(faceNum, { title: e.target.value })}
                          placeholder={`Face ${faceNum}`}
                          className="mt-1"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant={faces[faceNum].contentType === "text" ? "default" : "outline"}
                          onClick={() => updateFace(faceNum, { contentType: "text" })}
                          className="h-12"
                        >
                          <Type className="w-4 h-4 mr-2" />
                          Add Text
                        </Button>
                        <Button
                          type="button"
                          variant={faces[faceNum].contentType === "image" ? "default" : "outline"}
                          onClick={() => fileInputRefs.current[faceNum]?.click()}
                          className="h-12"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                      </div>

                      <input
                        ref={(el) => { fileInputRefs.current[faceNum] = el; }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(faceNum, e)}
                        className="hidden"
                      />

                      {faces[faceNum].contentType === "text" && (
                        <div>
                          <label className="text-sm font-medium">Text Content</label>
                          <Textarea
                            value={faces[faceNum].text}
                            onChange={(e) => updateFace(faceNum, { text: e.target.value })}
                            placeholder="Enter your text here..."
                            rows={4}
                            className="mt-1"
                          />
                        </div>
                      )}

                      {faces[faceNum].imagePreview && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Image Preview</label>
                          <div className="relative">
                            <img
                              src={faces[faceNum].imagePreview!}
                              alt={`Face ${faceNum} preview`}
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFaceContent(faceNum)}
                              className="absolute top-2 right-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {faces[faceNum].text.trim() === "" && !faces[faceNum].imageFile && (
                        <div className="text-center py-8 border-2 border-dashed border-neutral-300 rounded-lg">
                          <ImageIcon className="w-12 h-12 mx-auto text-neutral-400 mb-2" />
                          <p className="text-sm text-muted-foreground">No content added to this face yet</p>
                        </div>
                      )}

                      {(faces[faceNum].text.trim() || faces[faceNum].imageFile) && (
                        <Button
                          variant="outline"
                          onClick={() => removeFaceContent(faceNum)}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear Face Content
                        </Button>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={handleViewCube}
                disabled={!isAnyFacePopulated() || isLoading}
                className="flex-1 bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-neutral-900 hover:to-black"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Cube
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </Button>
            </div>

            {isPreviewMode && cubeData && (
              <Button
                onClick={handleSecureCube}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
              >
                <Lock className="w-4 h-4 mr-2" />
                Secure Cube - Continue to Payment
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <CubeViewer />
            
            {isPreviewMode && (
              <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-neutral-800 border-emerald-200/60">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2 text-emerald-800 dark:text-emerald-200">🎉 Your Cube is Ready!</h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
                    Your custom TicketCube™ has been generated successfully. Click "Secure Cube" to save it permanently and proceed to payment.
                  </p>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                    • Drag to rotate the cube
                    • Scroll to zoom in/out
                    • Your cube will be saved to the blockchain
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
