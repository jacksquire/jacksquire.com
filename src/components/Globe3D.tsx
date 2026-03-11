import { useRef, useEffect, useState, useMemo } from 'react';
import { feature } from 'topojson-client';
import isoCountries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import countries from 'world-atlas/countries-110m.json';

// Register English locale for country code conversion
isoCountries.registerLocale(enLocale);

interface Globe3DProps {
  countries: Array<{ code: string; name: string }>;
  cities: Array<{
    city: string;
    country: string;
    lat: number;
    lon: number;
    type: string;
    dates: string | null;
    note: string;
  }>;
}

export default function Globe3D({ countries: visitedCountries, cities }: Globe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [Globe, setGlobe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Safety check for SSR
  if (typeof window === 'undefined') {
    return null;
  }

  // Prepare polygon data with visited flag
  const polygonData = useMemo(() => {
    // Convert visited country codes to numeric Set
    const visitedCodes = new Set(
      visitedCountries
        .map((country) => Number(isoCountries.alpha2ToNumeric(country.code)))
        .filter((id) => Number.isFinite(id))
    );

    // Convert world-atlas topology to GeoJSON features
    const world = feature(countries as any, (countries as any).objects.countries);

    // Map each feature to include visited flag
    return world.features.map((geo: any) => ({
      ...geo,
      visited: visitedCodes.has(Number(geo.id)),
    }));
  }, [visitedCountries]);

  // Dynamically import Globe component (client-side only)
  useEffect(() => {
    import('react-globe.gl').then((mod) => {
      setGlobe(() => mod.default);
      setIsLoading(false);
    });
  }, []);

  // Measure container dimensions and set up resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = Math.round(width * 0.75); // 4:3 aspect ratio
      setDimensions({ width, height });
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Set initial camera position after globe loads
  useEffect(() => {
    if (!globeRef.current) return;

    // Center on Atlantic (shows Americas + Europe)
    setTimeout(() => {
      if (globeRef.current?.pointOfView) {
        globeRef.current.pointOfView({ lat: 20, lng: -40, altitude: 2.5 });
      }
    }, 100);
  }, [Globe]);

  if (isLoading || !Globe) {
    return (
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '450px',
          borderRadius: '16px',
          background:
            'radial-gradient(circle at top, rgba(99, 102, 241, 0.14), transparent 60%), linear-gradient(180deg, rgba(12, 12, 16, 0.95), rgba(8, 8, 8, 0.95))',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.875rem',
        }}
      >
        Loading globe...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '16px',
        background:
          'radial-gradient(circle at top, rgba(99, 102, 241, 0.14), transparent 60%), linear-gradient(180deg, rgba(12, 12, 16, 0.95), rgba(8, 8, 8, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        overflow: 'hidden',
        minHeight: '450px',
      }}
    >
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        // Globe appearance
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        // Atmosphere
        showAtmosphere={true}
        atmosphereColor="rgba(99, 102, 241, 0.3)"
        atmosphereAltitude={0.15}
        // Animation
        animateIn={true}
        autoRotate={true}
        autoRotateSpeed={0.4}
        // Country polygons
        polygonsData={polygonData}
        polygonCapColor={(d: any) =>
          d.visited ? 'rgba(99, 102, 241, 0.6)' : 'rgba(23, 23, 23, 0.6)'
        }
        polygonSideColor={() => 'rgba(50, 50, 50, 0.15)'}
        polygonStrokeColor={() => 'rgba(255, 255, 255, 0.15)'}
        polygonAltitude={(d: any) => (d.visited ? 0.01 : 0.005)}
      />
    </div>
  );
}
