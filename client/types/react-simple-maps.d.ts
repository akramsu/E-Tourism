declare module 'react-simple-maps' {
  import { FC, ReactNode } from 'react'

  export interface ComposableMapProps {
    children?: ReactNode
    width?: number
    height?: number
    projection?: string
    projectionConfig?: {
      scale?: number
      center?: [number, number]
      rotate?: [number, number, number]
    }
    className?: string
    style?: React.CSSProperties
  }

  export interface GeographiesProps {
    children?: (props: { geographies: any[] }) => ReactNode
    geography?: string
    parseGeographies?: (data: any) => any[]
  }

  export interface GeographyProps {
    geography: any
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: React.CSSProperties
      hover?: React.CSSProperties
      pressed?: React.CSSProperties
    }
    onMouseEnter?: (event: React.MouseEvent) => void
    onMouseLeave?: (event: React.MouseEvent) => void
    onClick?: (event: React.MouseEvent) => void
    className?: string
  }

  export interface ZoomableGroupProps {
    children?: ReactNode
    zoom?: number
    center?: [number, number]
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void
  }

  export const ComposableMap: FC<ComposableMapProps>
  export const Geographies: FC<GeographiesProps>
  export const Geography: FC<GeographyProps>
  export const Sphere: FC<{ fill?: string; stroke?: string; strokeWidth?: number }>
  export const Graticule: FC<{ fill?: string; stroke?: string; strokeWidth?: number }>
  export const ZoomableGroup: FC<ZoomableGroupProps>
}
