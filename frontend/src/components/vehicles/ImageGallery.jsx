import { useState } from 'react';

export function ImageGallery({ images = [], alt }) {
  const urls = images?.length ? images : [];
  const [active, setActive] = useState(0);
  const main = urls[active];

  if (!main) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-gray-100 text-gray-400">
        No images available
      </div>
    );
  }

  return (
    <div>
      <div className="group relative aspect-[16/9] overflow-hidden rounded-xl bg-gray-100">
        <img
          src={main}
          alt={alt}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      {urls.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? 'border-secondary-500' : 'border-transparent'
              }`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

