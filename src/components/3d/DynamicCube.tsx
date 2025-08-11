
import { useEffect, useRef, memo } from "react"
import { Mesh, TextureLoader, MeshStandardMaterial, DoubleSide, Vector2, CanvasTexture } from "three"
import { useThree } from "@react-three/fiber"
import { useCube } from "@/contexts/CubeContext"

export const DynamicCube = memo(function DynamicCube() {
  const { cubeData } = useCube()
  const meshRef = useRef<Mesh | null>(null)
  const materialsRef = useRef<MeshStandardMaterial[]>([])
  const texturesRef = useRef<any[]>([])

  useEffect(() => {
    if (!cubeData || !meshRef.current) return

    const textureLoader = new TextureLoader()
    const materials: MeshStandardMaterial[] = []
    const textures: any[] = []

    if (cubeData.type === "standard" && "faces" in cubeData) {
      // Create materials for each face (up to 6 faces)
      const facePromises = Array.from({ length: 6 }, async (_, index) => {
        const face = cubeData.faces.find(f => f.number === index + 1)
        
        if (!face) {
          // Default face with branding for face 6 or empty faces
          if (index === 5) {
            return createTextMaterial("Powered by\nOTWChart", "#f0f0f0", "#333333")
          } else {
            return new MeshStandardMaterial({ 
              color: 0x808080,
              roughness: 0.5,
              metalness: 0.1,
              side: DoubleSide
            })
          }
        }

        // Handle image content
        if (face.contentType === "image") {
          const imageUrl = face.image.preview || face.image.url
          if (imageUrl) {
            try {
              const texture = await loadTexture(textureLoader, imageUrl)
              texture.flipY = true
              texture.center = new Vector2(0.5, 0.5)
              textures.push(texture)
              return new MeshStandardMaterial({ 
                map: texture,
                roughness: 0.3,
                metalness: 0.1,
                side: DoubleSide
              })
            } catch (error) {
              console.error("Error loading texture:", error)
              // Fallback to text if image fails
              return createTextMaterial(face.text || face.title, "#f0f0f0", "#333333")
            }
          }
        }

        // Handle text content
        const text = face.text || face.title || `Face ${face.number}`
        return createTextMaterial(text, "#f0f0f0", "#333333")
      })

      Promise.all(facePromises).then((resolvedMaterials) => {
        // Arrange materials in the correct order for cube faces
        // Three.js cube face order: +X, -X, +Y, -Y, +Z, -Z
        // Our face order: 1=front, 2=right, 3=back, 4=left, 5=top, 6=bottom
        const orderedMaterials = [
          resolvedMaterials[1], // face 2 -> +X (right)
          resolvedMaterials[3], // face 4 -> -X (left)  
          resolvedMaterials[4], // face 5 -> +Y (top)
          resolvedMaterials[5], // face 6 -> -Y (bottom)
          resolvedMaterials[0], // face 1 -> +Z (front)
          resolvedMaterials[2]  // face 3 -> -Z (back)
        ]

        materialsRef.current = orderedMaterials
        if (meshRef.current) {
          meshRef.current.material = orderedMaterials
        }
      })
    } else if (cubeData.type === "spectix") {
      const faces = [
        `Event: ${cubeData.eventName}`,
        `Venue: ${cubeData.venue}`,
        `Date: ${cubeData.date}`,
        `Seats: ${cubeData.seatingArea}`,
        `Tickets: ${cubeData.numberOfTickets}`,
        `Max Price: $${cubeData.maxPrice}`
      ]

      faces.forEach((text, index) => {
        const material = createTextMaterial(text, "#f0f0f0", "#000000")
        materials[index] = material
      })

      materialsRef.current = materials
      texturesRef.current = textures

      if (meshRef.current) {
        meshRef.current.material = materials
      }
    }

    return () => {
      texturesRef.current.forEach(texture => {
        if (texture && texture.dispose) texture.dispose()
      })
      materialsRef.current.forEach(material => {
        if (material && material.dispose) {
          if (material.map && material.map.dispose) material.map.dispose()
          material.dispose()
        }
      })
    }
  }, [cubeData])

  const loadTexture = (loader: TextureLoader, url: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject)
    })
  }

  const createTextMaterial = (text: string, bgColor: string, textColor: string): MeshStandardMaterial => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Background
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, 512, 512)
      
      // Text styling
      ctx.fillStyle = textColor
      ctx.font = 'bold 32px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Handle multi-line text
      const lines = text.split('\n')
      const lineHeight = 40
      const totalHeight = lines.length * lineHeight
      const startY = (512 - totalHeight) / 2 + lineHeight / 2
      
      lines.forEach((line, index) => {
        // Add word wrapping for long lines
        const maxWidth = 450
        const words = line.split(' ')
        let currentLine = ''
        let y = startY + (index * lineHeight)
        
        for (const word of words) {
          const testLine = currentLine + word + ' '
          const metrics = ctx.measureText(testLine)
          
          if (metrics.width > maxWidth && currentLine !== '') {
            ctx.fillText(currentLine.trim(), 256, y)
            currentLine = word + ' '
            y += lineHeight
          } else {
            currentLine = testLine
          }
        }
        ctx.fillText(currentLine.trim(), 256, y)
      })
      
      const texture = new CanvasTexture(canvas)
      return new MeshStandardMaterial({
        map: texture,
        roughness: 0.5,
        metalness: 0.1,
        side: DoubleSide
      })
    }
    
    // Fallback material
    return new MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.5,
      metalness: 0.1,
      side: DoubleSide
    })
  }

  return (
    <mesh 
      ref={meshRef} 
      position={[0, 0, 0]} 
      scale={0.35}
      rotation={[0, 0, 0]}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={0x808080}
        roughness={0.5}
        metalness={0.1}
        side={DoubleSide}
      />
    </mesh>
  )
})
