
import { useGLTF } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Suspense, useState, useEffect, memo } from "react"
import { OrbitControls, Stage } from "@react-three/drei"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Box } from "lucide-react"
import { useCube } from "@/contexts/CubeContext"
import { DynamicCube } from "./DynamicCube"

const DefaultModel = memo(function DefaultModel() {
  const { scene } = useGLTF("/ticketcubetmv001-m7b15jl4.glb")
  return <primitive object={scene} position={[0, 0, 0]} scale={0.14} rotation={[0.5, -0.5, 0]} />
})

const LoadingPlaceholder = memo(function LoadingPlaceholder() {
  return null
})

const CanvasContent = memo(function CanvasContent({ isPreviewMode, cubeData, isLoading, setIsRotating, isStatic }: {
  isPreviewMode: boolean
  cubeData: any
  isLoading: boolean
  setIsRotating: (rotating: boolean) => void
  isStatic?: boolean
}) {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Stage environment="city" intensity={0.6}>
        {isStatic || (!isPreviewMode || !cubeData) ? <DefaultModel /> : <DynamicCube />}
      </Stage>
      <OrbitControls 
        autoRotate={!isLoading}
        autoRotateSpeed={1}
        enableZoom={true}
        minDistance={1}
        maxDistance={10}
        target={[0, 0, 0]}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        enableDamping
        dampingFactor={0.05}
        onChange={() => setIsRotating(false)}
        onEnd={() => setIsRotating(true)}
      />
    </Suspense>
  )
})

const StableCanvas = memo(function StableCanvas({ children }: { children: React.ReactNode }) {
  return (
    <Canvas 
      shadows 
      dpr={[1, 2]} 
      camera={{ position: [2, 1.5, 2], fov: 35 }}
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    >
      {children}
    </Canvas>
  )
})

interface CubeViewerProps {
  isStatic?: boolean
}

export function CubeViewer({ isStatic = false }: CubeViewerProps) {
  const { cubeData, isPreviewMode } = useCube()
  const [isLoading, setIsLoading] = useState(true)
  const [isRotating, setIsRotating] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Card className="relative bg-gradient-to-b from-background to-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Box className="h-5 w-5" />
          {!isStatic && isPreviewMode && cubeData ? (
            <div className="flex flex-col">
              <span>{cubeData.eventName}</span>
              <span className="text-sm text-muted-foreground">
                {cubeData.venue}
              </span>
            </div>
          ) : (
            "Interactive TicketCube™ Preview"
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-square w-full rounded-lg border bg-black/5 dark:bg-white/5">
          <div className="absolute top-4 left-4 right-4 flex items-center justify-center z-10">
            <span className="px-4 py-2 rounded-full bg-background/95 backdrop-blur-sm text-sm font-medium shadow-sm border">
              Drag to rotate • Scroll to zoom
            </span>
          </div>
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <StableCanvas>
              <CanvasContent 
                isPreviewMode={isPreviewMode}
                cubeData={cubeData}
                isLoading={isLoading}
                setIsRotating={setIsRotating}
                isStatic={isStatic}
              />
            </StableCanvas>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

useGLTF.preload("/ticketcubetmv001-m7b15jl4.glb")
