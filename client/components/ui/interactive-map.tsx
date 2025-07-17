"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Loader2, MapPin } from "lucide-react"

// Dynamically import the map component to avoid SSR issues
const DynamicMap = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading map...</p>
      </div>
    </div>
  ),
})

interface InteractiveMapProps {
  attractions?: Array<{
    id: number
    name: string
    latitude: number
    longitude: number
    category: string
    rating: number
    image?: string
    price?: string
  }>
  center?: [number, number]
  zoom?: number
  height?: string
  onAttractionClick?: (attractionId: number) => void
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  attractions = [],
  center = [-7.7956, 110.3695], // Default to Yogyakarta, Indonesia
  zoom = 10,
  height = "h-64",
  onAttractionClick,
}) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={`${height} bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Initializing map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${height} relative rounded-lg overflow-hidden`}>
      <DynamicMap
        attractions={attractions}
        center={center}
        zoom={zoom}
        onAttractionClick={onAttractionClick}
      />
    </div>
  )
}

export default InteractiveMap
