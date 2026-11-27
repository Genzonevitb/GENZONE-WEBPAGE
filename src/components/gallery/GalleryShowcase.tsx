import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { CircularGallery } from './CircularGallery';
import { FlexCarousel } from './FlexCarousel';
import './GalleryShowcase.css';

export interface GalleryPhoto {
  id: string;
  src: string;
  alt?: string | undefined;
  title?: string | undefined;
  subtitle?: string | undefined;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  coverImage: string;
  photos: GalleryPhoto[];
}

export interface GalleryShowcaseProps {
  /** Albums to display. When omitted, the bundled mock collection is used. */
  albums?: GalleryAlbum[];
  /** Height of the interactive gallery stage; defaults to 560px. */
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  onAlbumSelect?: (album: GalleryAlbum) => void;
  onPhotoSelect?: (photo: GalleryPhoto, album: GalleryAlbum) => void;
}

const fallbackPhoto = (seed: string) => `https://picsum.photos/seed/${seed}/1400/1000`;

export const MOCK_GALLERY_ALBUMS: GalleryAlbum[] = [
  {
    id: 'coastal-light',
    title: 'Coastal Light',
    coverImage: fallbackPhoto('coastal-light-cover'),
    photos: [
      { id: 'coast-01', src: fallbackPhoto('coastline-dawn'), alt: 'Soft morning light over a quiet coastline', title: 'First Light', subtitle: 'Pacific coast' },
      { id: 'coast-02', src: fallbackPhoto('coastline-cliffs'), alt: 'Cliffs rising above blue ocean water', title: 'The Edge', subtitle: 'West shore' },
      { id: 'coast-03', src: fallbackPhoto('coastline-tide'), alt: 'Waves drawing patterns in the sand', title: 'Low Tide', subtitle: 'Late afternoon' },
      { id: 'coast-04', src: fallbackPhoto('coastline-evening'), alt: 'A pastel sunset over the sea', title: 'Afterglow', subtitle: 'Golden hour' },
    ],
  },
  {
    id: 'quiet-forms',
    title: 'Quiet Forms',
    coverImage: fallbackPhoto('quiet-forms-cover'),
    photos: [
      { id: 'forms-01', src: fallbackPhoto('sculpture-stone'), alt: 'Sculptural stone form against a neutral wall', title: 'Still Shape', subtitle: 'Material study' },
      { id: 'forms-02', src: fallbackPhoto('sculpture-shadow'), alt: 'A minimal object casting a long shadow', title: 'Long Shadow', subtitle: 'Light and volume' },
      { id: 'forms-03', src: fallbackPhoto('sculpture-curve'), alt: 'Curved abstract sculpture in a gallery', title: 'The Curve', subtitle: 'Object study' },
      { id: 'forms-04', src: fallbackPhoto('sculpture-white'), alt: 'White sculptural forms arranged together', title: 'White Space', subtitle: 'Studio series' },
    ],
  },
  {
    id: 'city-after-hours',
    title: 'City After Hours',
    coverImage: fallbackPhoto('city-after-hours-cover'),
    photos: [
      { id: 'city-01', src: fallbackPhoto('city-neon'), alt: 'Neon signs reflected on a rain-soaked street', title: 'Reflections', subtitle: 'Downtown, 10:42 pm' },
      { id: 'city-02', src: fallbackPhoto('city-crossing'), alt: 'People crossing a busy city avenue at night', title: 'Crossing', subtitle: 'Midtown' },
      { id: 'city-03', src: fallbackPhoto('city-window'), alt: 'Warm lights glowing through city windows', title: 'Windows', subtitle: 'Blue hour' },
      { id: 'city-04', src: fallbackPhoto('city-train'), alt: 'A train moving through a city station', title: 'Last Train', subtitle: 'Platform 2' },
    ],
  },
  {
    id: 'weekend-table',
    title: 'Weekend Table',
    coverImage: fallbackPhoto('weekend-table-cover'),
    photos: [
      { id: 'table-01', src: fallbackPhoto('table-breakfast'), alt: 'A bright breakfast table set for two', title: 'Slow Morning', subtitle: 'At home' },
      { id: 'table-02', src: fallbackPhoto('table-fruit'), alt: 'Fresh fruit arranged in a ceramic bowl', title: 'Seasonal', subtitle: 'Market finds' },
      { id: 'table-03', src: fallbackPhoto('table-coffee'), alt: 'A cup of coffee beside a book', title: 'Coffee Break', subtitle: 'Sunday ritual' },
      { id: 'table-04', src: fallbackPhoto('table-supper'), alt: 'A simple dinner served in warm evening light', title: 'Gather', subtitle: 'Around the table' },
    ],
  },
];

/**
 * Album browser + full-screen photo viewer modal.
 * Choose an album in the curved CircularGallery to open its photos inside a
 * full-screen FlexCarousel portal modal; close via X, Back button, or Escape.
 */
export function GalleryShowcase({
  albums,
  height = 560,
  className = '',
  style,
  onAlbumSelect,
  onPhotoSelect,
}: GalleryShowcaseProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizedAlbums = useMemo(() => {
    if (albums === undefined) return MOCK_GALLERY_ALBUMS;
    return albums;
  }, [albums]);

  const selectedAlbum = useMemo(
    () => normalizedAlbums.find(album => album.id === selectedAlbumId) ?? null,
    [normalizedAlbums, selectedAlbumId]
  );

  // Lock body scroll and listen for Escape while the FlexCarousel modal is open
  useEffect(() => {
    if (!selectedAlbum || typeof document === 'undefined' || typeof window === 'undefined') return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the close button (or carousel) cleanly after mount
    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus({ preventScroll: true });
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        e.preventDefault();
        setSelectedAlbumId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAlbum]);

  const albumItems = useMemo(
    () =>
      normalizedAlbums.map(album => ({
        image: album.coverImage,
        text: album.title,
        description: `${album.photos.length} ${album.photos.length === 1 ? 'photograph' : 'photographs'}`,
      })),
    [normalizedAlbums]
  );

  const photoItems = useMemo(() => {
    if (!selectedAlbum) return [];
    const photos = selectedAlbum.photos.length
      ? selectedAlbum.photos
      : [
          {
            id: `${selectedAlbum.id}-cover`,
            src: selectedAlbum.coverImage,
            alt: `${selectedAlbum.title} album cover`,
            title: selectedAlbum.title,
          },
        ];
    return photos.map(item => ({
      src: item.src,
      alt: item.alt ?? item.title ?? selectedAlbum.title,
      title: item.title ?? item.alt ?? selectedAlbum.title,
      subtitle: item.subtitle,
    }));
  }, [selectedAlbum]);

  const stageStyle = {
    '--gallery-showcase-height': typeof height === 'number' ? `${height}px` : height,
    ...style,
  } as CSSProperties;

  const openAlbum = (index: number) => {
    const album = normalizedAlbums[index];
    if (!album) return;
    setSelectedAlbumId(album.id);
    onAlbumSelect?.(album);
  };

  return (
    <div className={`gallery-showcase ${className}`.trim()} style={stageStyle} aria-label="Gallery showcase">
      <div className="gallery-showcase__stage">
        {mounted && albumItems.length > 0 && (
          <CircularGallery
            items={albumItems}
            openOnClick={false}
            showTitles
            snap
            itemAspect={0.86}
            itemSize={1}
            onItemClick={(_: unknown, index: number) => openAlbum(index)}
            className="gallery-showcase__albums"
          />
        )}
      </div>

      {mounted &&
        selectedAlbum &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="gallery-showcase-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedAlbum.title} photo viewer`}
          >
            <div
              className="gallery-showcase-modal__backdrop"
              onClick={() => setSelectedAlbumId(null)}
              aria-hidden="true"
            />

            <div className="gallery-showcase-modal__toolbar">
              <button
                type="button"
                className="gallery-showcase-modal__back"
                onClick={() => setSelectedAlbumId(null)}
                aria-label="Back to albums"
              >
                <span aria-hidden="true">←</span> Albums
              </button>

              <div className="gallery-showcase-modal__heading" aria-live="polite">
                <h2>{selectedAlbum.title}</h2>
                <p>
                  {selectedAlbum.photos.length}{' '}
                  {selectedAlbum.photos.length === 1 ? 'photograph' : 'photographs'}
                </p>
              </div>

              <button
                ref={closeBtnRef}
                type="button"
                className="gallery-showcase-modal__close"
                onClick={() => setSelectedAlbumId(null)}
                aria-label="Close album viewer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="gallery-showcase-modal__stage">
              <FlexCarousel
                key={selectedAlbum.id}
                items={photoItems}
                intro="rise"
                preset="liquid"
                captions
                focusOnClick
                captureWheel
                onSelect={(index: number) => {
                  const photo = selectedAlbum.photos[index];
                  if (photo) onPhotoSelect?.(photo, selectedAlbum);
                }}
                className="gallery-showcase__carousel"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default GalleryShowcase;
