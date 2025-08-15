import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { ticketCubeService } from "@/services/ticketCubeService"
import { useAuth } from './AuthContext';

// Define types for Cube data
export interface CubeFace {
  id: string
  number: number // 1-6
  title: string
  contentType: "image" | "text"
  text?: string
  image: {
    file?: File
    preview?: string
    url?: string
  }
}

export interface StandardCubeData {
  type: "standard"
  title: string
  description?: string
  faces: CubeFace[]
}

export interface SpecTixCubeData {
  type: "spectix"
  eventName: string
  venue: string
  date: string
  seatingArea: string
  numberOfTickets: string
  maxPrice: string
}

export type CubeData = StandardCubeData | SpecTixCubeData

interface CubeContextType {
  cubeData: CubeData | null
  isPreviewMode: boolean
  setCubeData: (data: CubeData) => Promise<void>
  updateCubeFace: (faceNumber: number, face: Partial<CubeFace>) => Promise<void>
  setPreviewMode: (preview: boolean) => void
  resetCube: () => void
  saveCube: () => Promise<string | null>
  loadCube: (cubeId: string) => Promise<void>
  isLoading: boolean
}

const CubeContext = createContext<CubeContextType | undefined>(undefined)

export function CubeProvider({ children }: { children: ReactNode }) {
  const [cubeData, setCubeData] = useState<CubeData | null>(null);
  const [isPreviewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth(); // Removed supabaseUser

  const resetCube = () => {
    setCubeData(null);
  }

  const saveCube = useCallback(async (): Promise<string | null> => {
    if (!cubeData || !user) {
      throw new Error("User must be logged in to save cubes")
    }
    
    setIsLoading(true)
    try {
      let cubeDataToSave

      if (cubeData.type === "standard") {
        // Upload images for faces that have them
        const facesWithUploadedImages = await Promise.all(
          cubeData.faces.map(async (face) => {
            if (face.image.file && user) {
              try {
                const imageUrl = await ticketCubeService.uploadImage(face.image.file, user.id)
                return {
                  face_number: face.number,
                  content_type: face.contentType,
                  content_text: face.contentType === "text" ? face.text : undefined,
                  image_url: face.contentType === "image" ? imageUrl : undefined,
                  face_title: face.title
                }
              } catch (error) {
                console.error(`Error uploading image for face ${face.number}:`, error)
                // Fallback to text content if image upload fails
                return {
                  face_number: face.number,
                  content_type: "text" as const,
                  content_text: face.text || `Face ${face.number}`,
                  face_title: face.title
                }
              }
            } else {
              return {
                face_number: face.number,
                content_type: face.contentType,
                content_text: face.contentType === "text" ? face.text : undefined,
                image_url: face.contentType === "image" && face.image.url ? face.image.url : undefined,
                face_title: face.title
              }
            }
          })
        )

        cubeDataToSave = {
          title: cubeData.title,
          description: cubeData.description,
          cube_type: "standard" as const,
          faces: facesWithUploadedImages
        }
      } else {
        // SpecTix cube
        cubeDataToSave = {
          title: `${cubeData.eventName} SpecTix Request`,
          event_name: cubeData.eventName,
          venue: cubeData.venue,
          event_date: cubeData.date,
          cube_type: "spectix" as const,
          faces: [
            {
              face_number: 1,
              content_type: "text" as const,
              content_text: `Event: ${cubeData.eventName}`,
              face_title: "Event"
            },
            {
              face_number: 2,
              content_type: "text" as const,
              content_text: `Venue: ${cubeData.venue}`,
              face_title: "Venue"
            },
            {
              face_number: 3,
              content_type: "text" as const,
              content_text: `Date: ${cubeData.date}`,
              face_title: "Date"
            },
            {
              face_number: 4,
              content_type: "text" as const,
              content_text: `Seating: ${cubeData.seatingArea}`,
              face_title: "Seating"
            },
            {
              face_number: 5,
              content_type: "text" as const,
              content_text: `Tickets: ${cubeData.numberOfTickets}`,
              face_title: "Tickets"
            },
            {
              face_number: 6,
              content_type: "text" as const,
              content_text: `Max Price: $${cubeData.maxPrice}`,
              face_title: "Max Price"
            }
          ]
        }
      }

      const savedCube = await ticketCubeService.createTicketCube(
        user.id, // Use the Supabase user ID directly
        cubeDataToSave
      )

      return savedCube.id
    } catch (error) {
      console.error("Error saving cube:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [cubeData, user])

  const loadCube = useCallback(async (cubeId: string) => {
    if (!user) {
      throw new Error("User must be logged in to load cubes")
    }

    setIsLoading(true)
    try {
      const cubeResult = await ticketCubeService.getTicketCube(cubeId, user.id)
      
      if (!cubeResult) {
        throw new Error("Cube not found or access denied")
      }

      const { cube, faces } = cubeResult

      if (cube.cube_type === "standard") {
        const cubeFaces: CubeFace[] = faces.map(face => ({
          id: face.id,
          number: face.face_number,
          title: face.face_title || `Face ${face.face_number}`,
          contentType: face.content_type,
          text: face.content_text,
          image: {
            url: face.image_url || undefined
          }
        }))

        setCubeData({
          type: "standard",
          title: cube.title,
          description: cube.description,
          faces: cubeFaces
        })
      } else {
        // SpecTix cube - reconstruct from stored data
        setCubeData({
          type: "spectix",
          eventName: cube.event_name || "",
          venue: cube.venue || "",
          date: cube.event_date || "",
          seatingArea: faces.find(f => f.face_number === 4)?.content_text?.replace("Seating: ", "") || "",
          numberOfTickets: faces.find(f => f.face_number === 5)?.content_text?.replace("Tickets: ", "") || "",
          maxPrice: faces.find(f => f.face_number === 6)?.content_text?.replace("Max Price: $", "") || ""
        })
      }

      setPreviewMode(true)
    } catch (error) {
      console.error("Error loading cube:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const value: CubeContextType = {
    cubeData,
    isPreviewMode,
    setCubeData,
    updateCubeFace,
    setPreviewMode,
    resetCube,
    saveCube,
    loadCube,
    isLoading
  }

  return (
    <CubeContext.Provider value={value}>
      {children}
    </CubeContext.Provider>
  )
}

export function useCube() {
  const context = useContext(CubeContext)
  if (context === undefined) {
    throw new Error("useCube must be used within a CubeProvider")
  }
  return context
}