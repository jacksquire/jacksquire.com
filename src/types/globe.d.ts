declare module 'react-globe.gl' {
  import { ForwardRefExoticComponent, RefAttributes } from 'react';

  interface GlobeRef {
    pointOfView: (pov: { lat: number; lng: number; altitude: number }, duration?: number) => void;
    camera: () => any;
    scene: () => any;
    renderer: () => any;
    controls: () => any;
  }

  interface GlobeProps {
    // Globe textures and appearance
    globeImageUrl?: string;
    backgroundImageUrl?: string;
    bumpImageUrl?: string;
    width?: number;
    height?: number;

    // Animation
    animateIn?: boolean;
    autoRotate?: boolean;
    autoRotateSpeed?: number;

    // Polygons (for country highlighting)
    polygonsData?: Array<Record<string, any>>;
    polygonCapColor?: string | ((d: Record<string, any>) => string);
    polygonSideColor?: string | ((d: Record<string, any>) => string);
    polygonStrokeColor?: string | ((d: Record<string, any>) => string);
    polygonLabel?: string | ((d: Record<string, any>) => string);
    polygonAltitude?: number | ((d: Record<string, any>) => number);
    onPolygonHover?: (polygon: Record<string, any> | null, prevPolygon: Record<string, any> | null) => void;
    onPolygonClick?: (polygon: Record<string, any>, event: MouseEvent) => void;

    // Arcs (for travel paths)
    arcsData?: Array<Record<string, any>>;
    arcColor?: string | string[] | ((d: Record<string, any>) => string | string[]);
    arcDashLength?: number | ((d: Record<string, any>) => number);
    arcDashGap?: number | ((d: Record<string, any>) => number);
    arcDashAnimateTime?: number | ((d: Record<string, any>) => number);
    arcStroke?: number | ((d: Record<string, any>) => number);
    arcAltitude?: number | string | ((d: Record<string, any>) => number);
    arcAltitudeAutoScale?: number | string | ((d: Record<string, any>) => number);
    arcLabel?: string | ((d: Record<string, any>) => string);

    // Atmosphere
    atmosphereColor?: string;
    atmosphereAltitude?: number;
    showAtmosphere?: boolean;

    // Points (for city markers)
    pointsData?: Array<Record<string, any>>;
    pointLat?: number | string | ((d: Record<string, any>) => number);
    pointLng?: number | string | ((d: Record<string, any>) => number);
    pointColor?: string | ((d: Record<string, any>) => string);
    pointAltitude?: number | string | ((d: Record<string, any>) => number);
    pointRadius?: number | ((d: Record<string, any>) => number);
    pointLabel?: string | ((d: Record<string, any>) => string);
    onPointClick?: (point: Record<string, any>, event: MouseEvent) => void;
    onPointHover?: (point: Record<string, any> | null, prevPoint: Record<string, any> | null) => void;

    // Other props
    [key: string]: any;
  }

  const Globe: ForwardRefExoticComponent<GlobeProps & RefAttributes<GlobeRef>>;

  export default Globe;
}
