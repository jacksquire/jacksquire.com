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
  countryNotes?: Array<{
    code: string;
    name: string;
    title: string;
    note: string;
  }>;
}

export default function Globe3D({ countries: visitedCountries, cities, countryNotes = [] }: Globe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [Globe, setGlobe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoverCountry, setHoverCountry] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Safety check for SSR
  if (typeof window === 'undefined') {
    return null;
  }

  // Build countryNotes lookup map
  const countryNotesMap = useMemo(() => {
    const map = new Map<string, { title: string; note: string }>();
    countryNotes.forEach((cn) => {
      map.set(cn.code, { title: cn.title, note: cn.note });
    });
    return map;
  }, [countryNotes]);

  // Build visited countries map (code -> name)
  const visitedCountriesMap = useMemo(() => {
    const map = new Map<number, string>();
    visitedCountries.forEach((country) => {
      const numericCode = Number(isoCountries.alpha2ToNumeric(country.code));
      if (Number.isFinite(numericCode)) {
        map.set(numericCode, country.name);
      }
    });
    return map;
  }, [visitedCountries]);

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

  // Generate arc data connecting consecutive cities lived
  const arcsData = useMemo(
    () =>
      cities.slice(0, -1).map((city, i) => ({
        startLat: city.lat,
        startLng: city.lon,
        endLat: cities[i + 1].lat,
        endLng: cities[i + 1].lon,
        fromCity: city.city,
        toCity: cities[i + 1].city,
      })),
    [cities]
  );

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
        polygonCapColor={(d: any) => {
          const isHovered = hoverCountry && hoverCountry.id === d.id;
          if (isHovered && d.visited) return 'rgba(99, 102, 241, 0.85)';
          if (isHovered && !d.visited) return 'rgba(40, 40, 40, 0.7)';
          return d.visited ? 'rgba(99, 102, 241, 0.6)' : 'rgba(23, 23, 23, 0.6)';
        }}
        polygonSideColor={() => 'rgba(50, 50, 50, 0.15)'}
        polygonStrokeColor={() => 'rgba(255, 255, 255, 0.15)'}
        polygonAltitude={(d: any) => (d.visited ? 0.01 : 0.005)}
        // Animated arcs connecting cities lived
        arcsData={arcsData}
        arcColor={() => ['rgba(249, 115, 22, 0.8)', 'rgba(249, 115, 22, 0.3)']}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        arcStroke={0.5}
        arcAltitude={0.15}
        arcAltitudeAutoScale={0.3}
        arcLabel={(d: any) => `
          <div style="background: rgba(20,20,20,0.95); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); font-size: 13px; color: #e5e5e5; font-family: 'Inter', sans-serif;">
            <span style="color: rgba(249,115,22,0.9);">${d.fromCity}</span>
            <span style="color: rgba(255,255,255,0.4);"> &rarr; </span>
            <span style="color: rgba(249,115,22,0.9);">${d.toCity}</span>
          </div>
        `}
        polygonLabel={(d: any) => {
          const countryName = visitedCountriesMap.get(Number(d.id)) || d.properties?.name || 'Unknown';
          const visited = d.visited;
          return `
            <div style="background: rgba(20,20,20,0.95); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); font-size: 13px; color: #e5e5e5; font-family: 'Inter', sans-serif;">
              <strong style="color: #fff;">${countryName}</strong>
              ${visited ? '<div style="color: rgba(99,102,241,0.9); font-size: 11px; margin-top: 2px;">Visited</div>' : ''}
            </div>
          `;
        }}
        onPolygonHover={(polygon: any) => {
          setHoverCountry(polygon);
        }}
        onPolygonClick={(polygon: any) => {
          if (!polygon || !polygon.visited) {
            setSelectedCountry(null);
            return;
          }

          const countryName = visitedCountriesMap.get(Number(polygon.id));
          if (selectedCountry === countryName) {
            setSelectedCountry(null);
            return;
          }

          setSelectedCountry(countryName || null);

          // Animate camera to center on country
          if (globeRef.current && polygon.properties) {
            // Use rough centroid calculation from polygon bounds
            const bounds = polygon.geometry?.coordinates?.[0];
            if (bounds && bounds.length > 0) {
              let sumLat = 0, sumLng = 0, count = 0;
              bounds.forEach((coord: [number, number]) => {
                sumLng += coord[0];
                sumLat += coord[1];
                count++;
              });
              const centerLng = sumLng / count;
              const centerLat = sumLat / count;

              globeRef.current.pointOfView({ lat: centerLat, lng: centerLng, altitude: 1.5 }, 1000);
            }
          }
        }}
      />

      {selectedCountry && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(20, 20, 20, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '280px',
            color: '#e5e5e5',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <strong style={{ color: '#fff', fontSize: '16px' }}>{selectedCountry}</strong>
            <button
              onClick={() => setSelectedCountry(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0',
                marginLeft: '12px',
                lineHeight: '1',
              }}
            >
              ×
            </button>
          </div>
          <div
            style={{
              color: 'rgba(99, 102, 241, 0.9)',
              fontSize: '12px',
              marginBottom: '12px',
            }}
          >
            Visited
          </div>
          {(() => {
            const countryCode = visitedCountries.find(c => c.name === selectedCountry)?.code;
            const note = countryCode ? countryNotesMap.get(countryCode) : null;
            if (note) {
              return (
                <>
                  <div style={{ color: '#fff', fontWeight: '500', marginBottom: '4px' }}>
                    {note.title}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
                    {note.note}
                  </div>
                </>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
}
