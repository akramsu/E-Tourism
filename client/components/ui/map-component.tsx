"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { Star, MapPin, Eye } from "lucide-react"

// Fix for default markers in react-leaflet
const DefaultIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Create custom icons for different categories
const createCustomIcon = (category: string) => {
  const colors: { [key: string]: string } = {
    temple: "#8B5CF6", // Purple
    nature: "#10B981", // Green
    beach: "#06B6D4", // Cyan
    mountain: "#6B7280", // Gray
    museum: "#F59E0B", // Yellow
    park: "#84CC16", // Lime
    default: "#3B82F6", // Blue
  }

  const color = colors[category.toLowerCase()] || colors.default

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
      ">
        📍
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}

interface MapComponentProps {
  attractions: Array<{
    id: number
    name: string
    latitude: number
    longitude: number
    category: string
    rating: number
    image?: string
    price?: string
  }>
  center: [number, number]
  zoom: number
  onAttractionClick?: (attractionId: number) => void
}

const MapComponent: React.FC<MapComponentProps> = ({
  attractions,
  center,
  zoom,
  onAttractionClick,
}) => {
  // Set default icon to fix marker display issues
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })
  }, [])

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {attractions.map((attraction) => (
        <Marker
          key={attraction.id}
          position={[attraction.latitude, attraction.longitude]}
          icon={createCustomIcon(attraction.category)}
        >
          <Popup className="custom-popup" minWidth={250}>
            <div className="p-2">
              {attraction.image && (
                <img
                  src={attraction.image}
                  alt={attraction.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}
              
              <h3 className="font-bold text-slate-900 mb-2 text-lg">
                {attraction.name}
              </h3>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {attraction.category}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">
                    {attraction.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              
              {attraction.price && (
                <p className="text-sm font-semibold text-slate-900 mb-3">
                  {attraction.price}
                </p>
              )}
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">
                  {attraction.latitude.toFixed(4)}, {attraction.longitude.toFixed(4)}
                </span>
              </div>
              
              {onAttractionClick && (
                <button
                  onClick={() => onAttractionClick(attraction.id)}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default MapComponent
