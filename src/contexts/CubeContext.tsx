import { createContext, useContext, useState, useCallback, ReactNode } from "react"

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

interface CubeProviderProps {
  children: ReactNode
}

export function CubeProvider({ children }: CubeProviderProps) {
  const [cubeData, setCubeDataState] = useState<CubeData | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const setCubeData = useCallback(async (data: CubeData) => {
    setCubeDataState(data)
  }, [])

  const updateCubeFace = useCallback(async (faceNumber: number, faceUpdate: Partial<CubeFace>) => {
    if (!cubeData || cubeData.type !== "standard") return

    const updatedFaces = cubeData.faces.map(face => 
      face.number === faceNumber 
        ? { ...face, ...faceUpdate }
        : face
    )

    setCubeDataState({
      ...cubeData,
      faces: updatedFaces
    })
  }, [cubeData])

  const setPreviewMode = useCallback((preview: boolean) => {
    setIsPreviewMode(preview)
  }, [])

  const resetCube = useCallback(() => {
    setCubeDataState(null)
    setIsPreviewMode(false)
  }, [])

  const saveCube = useCallback(async (): Promise<string | null> => {
    if (!cubeData) return null
    
    setIsLoading(true)
    try {
      // TODO: Implement database save logic
      console.log("Saving cube:", cubeData)
      return "temp-cube-id"
    } catch (error) {
      console.error("Error saving cube:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [cubeData])

  const loadCube = useCallback(async (cubeId: string) => {
    setIsLoading(true)
    try {
      // TODO: Implement database load logic
      console.log("Loading cube:", cubeId)
    } catch (error) {
      console.error("Error loading cube:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

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