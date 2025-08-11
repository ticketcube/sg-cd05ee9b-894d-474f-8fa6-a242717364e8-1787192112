import { useEffect, useRef, memo } from "react"
import { BoxGeometry, Mesh, TextureLoader, MeshStandardMaterial, DoubleSide, Vector2, CanvasTexture } from "three"
import { useThree } from "@react-three/fiber"
import { useCube } from "@/contexts/CubeContext"

export const DynamicCube = memo(function DynamicCube() {
  const { cubeData } = useCube()
  const meshRef = useRef<Mesh | null>(null)
  const { scene } = useThree()
  const materialsRef = useRef<MeshStandardMaterial[]>([])
  const texturesRef = useRef<any[]>([])

  useEffect(() => {
    if (!cubeData || !meshRef.current) return

    const textureLoader = new TextureLoader()
    const materials: MeshStandardMaterial[] = []
    const textures: any[] = []

    if (cubeData.type === "standard" && "faces" in cubeData) {
      const tempMaterials = cubeData.faces.map(face => {
        if (face.image.preview) {
          const texture = textureLoader.load(face.image.preview)
          texture.flipY = true
          texture.center = new Vector2(0.5, 0.5)
          textures.push(texture)
          return new MeshStandardMaterial({ 
            map: texture,
            roughness: 0.5,
            metalness: 0.1,
            side: DoubleSide
          })
        } else {
          return new MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.5,
            metalness: 0.1,
            side: DoubleSide
          })
        }
      })

      materials[0] = tempMaterials[0]  // front
      materials[1] = tempMaterials[2]  // back
      materials[2] = tempMaterials[1]  // right
      materials[3] = tempMaterials[3]  // left
      materials[4] = tempMaterials[4]  // top
      materials[5] = tempMaterials[5]  // bottom
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
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#f0f0f0'
          ctx.fillRect(0, 0, 256, 256)
          ctx.fillStyle = '#000000'
          ctx.font = '24px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(text, 128, 128)
          
          const texture = new CanvasTexture(canvas)
          textures.push(texture)
          materials[index] = new MeshStandardMaterial({
            map: texture,
            roughness: 0.5,
            metalness: 0.1,
            side: DoubleSide
          })
        }
      })
    }

    materialsRef.current = materials
    texturesRef.current = textures

    if (meshRef.current) {
      meshRef.current.material = materials
    }

    return () => {
      texturesRef.current.forEach(texture => {
        if (texture) texture.dispose()
      })
      materialsRef.current.forEach(material => {
        if (material) {
          if (material.map) material.map.dispose()
          material.dispose()
        }
      })
    }
  }, [cubeData])

  return (
    <mesh 
      ref={meshRef} 
      position={[0, 0, 0]} 
      scale={0.35}
      rotation={[0, 0, 0]}
    >
      <boxGeometry args={[1, 1, 1]} />
      {Array(6).fill(null).map((_, index) => (
        <meshStandardMaterial 
          key={index} 
          color={0x808080}
          roughness={0.5}
          metalness={0.1}
          side={DoubleSide}
        />
      ))}
    </mesh>
  )
})