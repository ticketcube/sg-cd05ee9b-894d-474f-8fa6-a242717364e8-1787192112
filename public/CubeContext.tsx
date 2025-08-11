
import { createContext, useContext, useState, ReactNode, useEffect } from "react"

interface CubeFace {
  name: string
  description: string
  image: {
    file: File | null
    preview: string | null
  }
}

interface BaseCubeData {
  type: "standard" | "spectix"
  eventName: string
  venue: string
  date: Date | string | undefined
}

interface StandardCubeData extends BaseCubeData {
  type: "standard"
  faces: CubeFace[]
}

interface SpecTixCubeData extends BaseCubeData {
  type: "spectix"
  seatingArea: string
  numberOfTickets: string
  maxPrice: string
}

type CubeData = StandardCubeData | SpecTixCubeData

interface CubeContextType {
  cubeData: CubeData | null
  setCubeData: (data: CubeData) => void
  clearCubeData: () => void
  resetToDefault: () => void
  isPreviewMode: boolean
  setPreviewMode: (mode: boolean) => void
}

const CubeContext = createContext<CubeContextType>({
  cubeData: null,
  setCubeData: () => {},
  clearCubeData: () => {},
  resetToDefault: () => {},
  isPreviewMode: false,
  setPreviewMode: () => {}
})

const STORAGE_KEY = "ticketcube_data"
const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024

const compressImageData = async (imageData: string): Promise<string> => {
  if (imageData.startsWith("/")) {
    return imageData
  }
  
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      
      let width = img.width
      let height = img.height
      const maxDimension = 800
      
      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width
        width = maxDimension
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height
        height = maxDimension
      }

      canvas.width = width
      canvas.height = height
      
      ctx?.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL("image/jpeg", 0.7))
    }
    img.src = imageData
  })
}

export function CubeProvider({ children }: { children: ReactNode }) {
  const [cubeData, setCubeData] = useState<CubeData | null>(null)
  const [isPreviewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.date) {
          parsed.date = new Date(parsed.date)
        }
        setCubeData(parsed)
        setPreviewMode(true)
      } catch (error) {
        console.error("Error parsing stored cube data:", error)
        clearCubeData()
      }
    }
  }, [])

  const saveCubeData = async (data: CubeData) => {
    try {
      let processedData = { ...data }
      
      if (processedData.type === "standard" && (processedData as StandardCubeData).faces) {
        const standardData = processedData as StandardCubeData
        for (let face of standardData.faces) {
          if (face.image.preview) {
            face.image.preview = await compressImageData(face.image.preview)
          }
        }
      }

      const serializedData = JSON.stringify(processedData)
      if (serializedData.length > MAX_STORAGE_SIZE) {
        throw new Error("Data size too large. Please use smaller images.")
      }

      setCubeData(processedData)
      setPreviewMode(true)
      localStorage.setItem(STORAGE_KEY, serializedData)
    } catch (error) {
      console.error("Error saving cube data:", error)
      throw error
    }
  }

  const clearCubeData = () => {
    setCubeData(null)
    setPreviewMode(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  const resetToDefault = () => {
    clearCubeData()
  }

  return (
    <CubeContext.Provider value={{ 
      cubeData, 
      setCubeData: saveCubeData, 
      clearCubeData,
      resetToDefault,
      isPreviewMode,
      setPreviewMode
    }}>
      {children}
    </CubeContext.Provider>
  )
}

export const useCube = () => useContext(CubeContext)
