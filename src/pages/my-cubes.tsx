
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
ArrowLeft,
Box,
Calendar,
Eye,
Lock,
Unlock,
Gift,
RefreshCw,
Coins
} from "lucide-react";
import { ticketCubeService } from "@/services/ticketCubeService";
import type { TicketCube } from "@/services/ticketCubeService";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { DynamicCube } from "@/components/3d/DynamicCube";
import { useCube } from "@/contexts/CubeContext";

// Badge component
const TierBadge = ({ tier }: { tier: string }) => {
const getTierIcon = (tier: string) => {
 switch (tier.toLowerCase()) {
   case "free":
     return <Lock className="w-3 h-3" />;
   case "pro":
     return <RefreshCw className="w-3 h-3" />;
   case "collector":
     return <Coins className="w-3 h-3" />;
   default:
     return <Lock className="w-3 h-3" />;
 }
};

const getTierColor = (tier: string) => {
 switch (tier.toLowerCase()) {
   case "free":
     return "bg-gray-600 text-gray-100";
   case "pro":
     return "bg-blue-600 text-white";
   case "collector":
     return "bg-purple-600 text-white";
   default:
     return "bg-gray-600 text-gray-100";
 }
};

return (
 <Badge className={`${ getTierColor(tier) } flex items - center gap - 1`}>
   {getTierIcon(tier)}
   {tier.toUpperCase()}
 </Badge>
);
};

// Cube preview 3D
const CubePreview = ({ cube }: { cube: TicketCube }) => {
const { setCubeData } = useCube();
const [cubeFaces, setCubeFaces] = useState<any[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
 const loadCubeFaces = async () => {
   try {
     setIsLoading(true);
     const cubeResult = await ticketCubeService.getTicketCube(cube.id);

     if (cubeResult && Array.isArray(cubeResult.faces)) {
       const cubeFaceData = cubeResult.faces.map(face => ({
         id: face.id,
         number: face.face_number,
         title: face.face_title || `Face ${ face.face_number } `,
         contentType: face.content_type,
         text: face.content_text,
         image: {
           url: face.image_url,
           preview: face.image_url
         }
       }));

       const allFaces = [];
       for (let i = 1; i <= 6; i++) {
         const existingFace = cubeFaceData.find(f => f.number === i);
         allFaces.push(
           existingFace || {
             id: `default -${ i } `,
             number: i,
             contentType: "text" as const,
             text: i === 6 ? "TicketCube™" : `Face ${ i } `,
             image: { preview: null },
             title: i === 6 ? "TicketCube™" : `Face ${ i } `
           }
         );
       }

       setCubeFaces(allFaces);
       setCubeData({
         type: "standard",
         title: cube.title,
         description: cube.description,
         faces: allFaces
       });
     }
   } catch (error) {
     console.error("Error loading cube faces:", error);
   } finally {
     setIsLoading(false);
   }
 };

 loadCubeFaces();
}, [cube, setCubeData]);

if (isLoading) {
 return (
   <div className="w-full h-full flex items-center justify-center">
     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
   </div>
 );
}

return (
 <div className="w-full h-full">
   <Canvas camera={{ position: [0, 0, 2], fov: 45 }}>
     <ambientLight intensity={0.5} />
     <pointLight position={[10, 10, 10]} />
     <DynamicCube />
     <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
     <Environment preset="city" />
   </Canvas>
 </div>
);
};

// Main page
export default function MyCubesPage() {
const { user } = useAuth();
const [cubes, setCubes] = useState<TicketCube[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
 if (user) {
   loadUserCubes();
 }
}, [user]);

const loadUserCubes = async () => {
 if (!user) return;
 try {
   setLoading(true);
   setError(null);
   const result = await ticketCubeService.getUserTicketCubes(user.auth_id);
   setCubes(result.cubes || []);
 } catch (err) {
   const message =
     err instanceof Error ? err.message : "Failed to load cubes";
   setError(message);
 } finally {
   setLoading(false);
 }
};

const formatDate = (dateString: string | null) =>
 !dateString
   ? "No date"
   : new Date(dateString).toLocaleDateString("en-US", {
       year: "numeric",
       month: "short",
       day: "numeric"
     });

if (loading) {
 return (
   <div className="min-h-screen bg-black text-white flex items-center justify-center">
     <Box className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
     <h1 className="text-2xl font-bold mb-4">Loading Your TicketCubes...</h1>
   </div>
 );
}

if (error) {
 return (
   <div className="min-h-screen bg-black text-white flex items-center justify-center">
     <div className="text-center">
       <h1 className="text-2xl font-bold mb-4 text-red-500">
         Error Loading Cubes
       </h1>
       <p className="text-xl mb-4">{error}</p>
       <Button
         onClick={loadUserCubes}
         className="bg-blue-600 hover:bg-blue-700"
       >
         Try Again
       </Button>
     </div>
   </div>
 );
}

return (
 <AuthGuard>
   <div className="min-h-screen bg-black text-white p-4 max-w-4xl mx-auto">
     {cubes.length === 0 ? (
       <div className="text-center py-16">
         <Box className="w-20 h-20 mx-auto mb-6 text-gray-600" />
         <h2 className="text-2xl font-bold mb-4">No TicketCubes Yet</h2>
         <Button
           onClick={() => (window.location.href = "/ticketcube")}
           className="bg-blue-600 hover:bg-blue-700"
         >
           Create Your First Cube
         </Button>
       </div>
     ) : (
       cubes.map(cube => (
         <Card key={cube.id} className="bg-gray-900 border-gray-700 mb-6">
           <CardHeader>
             <div className="flex flex-col md:flex-row gap-6 h-[66vw] md:h-[400px] overflow-hidden">
               <div className="md:w-1/3 w-full p-4">
                 <CardTitle className="text-lg font-bold text-white mb-2">
                   {cube.title}
                 </CardTitle>
                 <TierBadge tier={cube.tier || "free"} />
               </div>
               <div className="md:w-2/3 w-full h-full">
                 <CubePreview cube={cube} />
               </div>
             </div>
           </CardHeader>
         </Card>
       ))
     )}
   </div>
 </AuthGuard>
);
}
