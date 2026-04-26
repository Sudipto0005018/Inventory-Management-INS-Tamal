// import { useState, useRef } from "react";
// import Autoplay from "embla-carousel-autoplay";

// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogTitle,
// } from "../components/ui/dialog";
// import { cn } from "../lib/utils";
// import {
//   Carousel,
//   CarouselContent,
//   CarouselItem,
//   CarouselNext,
//   CarouselPrevious,
// } from "../components/ui/carousel";
// import baseURL, { imageBaseURL } from "../utils/baseURL";

// const FALLBACK_IMAGE = "/images/fallback.jpg"; // local fallback path or external URL
// const MISSING_PLACEHOLDER = (
//   <div className="flex h-80 w-80 items-center justify-center rounded-md border bg-gray-50 text-gray-500">
//     No image available
//   </div>
// );

// const ImagePreviewDialog = ({ image, className = "" }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   const handleImgError = (e) => {
//     e.currentTarget.onerror = null; // prevent infinite loop
//     e.currentTarget.src = FALLBACK_IMAGE;
//   };

//   const hasImages = Array.isArray(image) ? image.length > 0 : !!image;
//   const firstSrc =
//     Array.isArray(image) && image.length > 0
//       ? `${imageBaseURL}${image[0]}`
//       : FALLBACK_IMAGE;

//   return (
//     <div className="overflow-x-hidden">
//       {!hasImages ? (
//         // show placeholder when no image provided
//         <div className="w-100 object-contain rounded-md border">
//           {MISSING_PLACEHOLDER}
//         </div>
//       ) : (
//         <>
//           <Carousel
//             className="relative"
//             opts={{
//               loop: true,
//               dragFree: true,
//             }}
//           >
//             <CarouselContent>
//               {Array.isArray(image) ? (
//                 image.map((img, idx) => (
//                   <CarouselItem key={idx}>
//                     <div className="p-1">
//                       <div className="flex aspect-square items-center justify-center p-6">
//                         <img
//                           src={`${imageBaseURL}${img}`}
//                           alt={`product-${idx}`}
//                           onError={handleImgError}
//                           className={cn(
//                             "max-w-full max-h-full object-contain",
//                             className,
//                           )}
//                         />
//                       </div>
//                     </div>
//                   </CarouselItem>
//                 ))
//               ) : (
//                 <CarouselItem>
//                   <div className="p-1">
//                     <div className="flex aspect-square items-center justify-center p-6">
//                       <img
//                         src={image}
//                         alt="product"
//                         onError={handleImgError}
//                         className={cn(
//                           "max-w-full max-h-full object-contain",
//                           className,
//                         )}
//                       />
//                     </div>
//                   </div>
//                 </CarouselItem>
//               )}
//             </CarouselContent>
//             <CarouselPrevious className="absolute top-1/2 left-0 -translate-y-1/2" />
//             <CarouselNext className="absolute top-1/2 right-0 -translate-y-1/2" />
//           </Carousel>

//           <Dialog open={isOpen} onOpenChange={(set) => setIsOpen(set)}>
//             <DialogContent onPointerDownOutside={() => {}}>
//               <DialogTitle className="hidden" />
//               <DialogDescription className="hidden" />
//               {/* Show first image in dialog; use same error handler */}
//               <img
//                 src={
//                   Array.isArray(image) && image.length > 0
//                     ? `${imageBaseURL}${image[0]}`
//                     : image || FALLBACK_IMAGE
//                 }
//                 onError={handleImgError}
//                 alt="preview"
//                 className="w-full object-contain"
//               />
//             </DialogContent>
//           </Dialog>
//         </>
//       )}
//     </div>
//   );
// };

// export default ImagePreviewDialog;

import { useState, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  FaMagnifyingGlassPlus,
  FaMagnifyingGlassMinus,
  FaXmark,
} from "react-icons/fa6";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";
import baseURL, { imageBaseURL } from "../utils/baseURL";

const FALLBACK_IMAGE = "/images/fallback.jpg";
const MISSING_PLACEHOLDER = (
  <div className="flex h-80 w-80 items-center justify-center rounded-md border bg-gray-50 text-gray-500">
    No image available
  </div>
);

// NEW: Zoom Dialog Component
const ZoomDialog = ({ image, open, onOpenChange }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      if (newZoom === 0.5) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] p-0 overflow-hidden bg-black/95"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2 bg-black/50 rounded-lg p-2">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Zoom In"
            >
              <FaMagnifyingGlassPlus className="size-5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Zoom Out"
            >
              <FaMagnifyingGlassMinus className="size-5" />
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 hover:bg-white/20 rounded-lg transition-colors text-white text-sm"
              title="Reset Zoom"
            >
              Reset
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Close"
            >
              <FaXmark className="size-5" />
            </button>
          </div>

          {/* Zoom level indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-lg px-3 py-1 text-white text-sm z-10">
            {Math.round(zoomLevel * 100)}%
          </div>

          {/* Image with zoom and pan */}
          <div
            className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-200"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                cursor: zoomLevel > 1 ? "grab" : "default",
              }}
            >
              <img
                src={image}
                alt="Zoomed view"
                className="max-w-full max-h-full object-contain select-none"
                onError={handleImgError}
                draggable={false}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// MODIFIED: Main ImagePreviewDialog with zoom on click
const ImagePreviewDialog = ({ image, className = "" }) => {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));

  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  // Helper to get image URL
  const getImageUrl = (img) => {
    if (!img) return FALLBACK_IMAGE;
    return img.startsWith("http") ? img : `${imageBaseURL}${img}`;
  };

  // Get current image for zoom
  const getCurrentImage = () => {
    if (Array.isArray(image) && image.length > 0) {
      return getImageUrl(image[currentImageIndex]);
    }
    return getImageUrl(image);
  };

  const hasImages = Array.isArray(image) ? image.length > 0 : !!image;

  // Get array of images for carousel
  const imageArray =
    Array.isArray(image) && image.length > 0 ? image : image ? [image] : [];

  const handleImageClick = (index = 0) => {
    setCurrentImageIndex(index);
    setIsFullscreenOpen(true);
  };

  const handleFullscreenImageClick = () => {
    // Close fullscreen and open zoom
    setIsFullscreenOpen(false);
    setTimeout(() => {
      setIsZoomOpen(true);
    }, 100);
  };

  if (!hasImages) {
    return MISSING_PLACEHOLDER;
  }

  return (
    <>
      {/* Carousel View */}
      <div className="overflow-x-hidden">
        <Carousel
          className="relative"
          opts={{
            loop: true,
            dragFree: true,
          }}
          plugins={[plugin.current]}
        >
          <CarouselContent>
            {imageArray.map((img, idx) => (
              <CarouselItem key={idx}>
                <div
                  className="p-1 cursor-pointer group relative"
                  onClick={() => handleImageClick(idx)}
                >
                  <div className="flex aspect-square items-center justify-center p-6 relative">
                    <img
                      src={getImageUrl(img)}
                      alt={`product-${idx}`}
                      onError={handleImgError}
                      className={cn(
                        "max-w-full max-h-full object-contain transition-transform duration-200 group-hover:scale-105",
                        className,
                      )}
                    />
                    {/* Zoom overlay indicator */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <FaMagnifyingGlassPlus className="text-white text-3xl" />
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {imageArray.length > 1 && (
            <>
              <CarouselPrevious className="absolute top-1/2 left-0 -translate-y-1/2" />
              <CarouselNext className="absolute top-1/2 right-0 -translate-y-1/2" />
            </>
          )}
        </Carousel>
      </div>

      {/* Fullscreen Dialog (first level) */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        {/* <DialogContent
          className="max-w-[100vw] w-[100vw] max-h-[100vh] h-[100vh] p-0 bg-black m-0 rounded-none"
          style={{
            transform: "translate(-50%, -50%)",
            top: "100%",
            left: "65%",
            width: "320vw",
            height: "100vh",
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
        > */}
        <DialogContent
          className="max-w-[90vw] w-[90vw] max-h-[90vh] p-0 bg-black/95"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="hidden" />
          <DialogDescription className="hidden" />

          <div className="relative w-full h-full flex items-center justify-center min-h-[80vh]">
            <button
              onClick={() => setIsFullscreenOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-white/20 rounded-full text-white"
            >
              ✕
            </button>

            {/* Show current image with click to zoom further */}
            <div
              className="cursor-pointer group relative flex items-center justify-center w-full h-full"
              onClick={handleFullscreenImageClick}
            >
              <img
                src={getCurrentImage()}
                alt="fullscreen preview"
                className="max-w-full max-h-[85vh] object-contain"
                onError={handleImgError}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <FaMagnifyingGlassPlus className="text-white text-5xl" />
              </div>
            </div>

            {/* Navigation arrows for multiple images in fullscreen */}
            {imageArray.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(
                      (prev) =>
                        (prev - 1 + imageArray.length) % imageArray.length,
                    );
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-full text-white z-10"
                >
                  ◀
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(
                      (prev) => (prev + 1) % imageArray.length,
                    );
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-full text-white z-10"
                >
                  ▶
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-lg px-3 py-1 text-white text-sm">
                  {currentImageIndex + 1} / {imageArray.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Zoom Dialog (second level) */}
      <ZoomDialog
        image={getCurrentImage()}
        open={isZoomOpen}
        onOpenChange={setIsZoomOpen}
      />
    </>
  );
};

export default ImagePreviewDialog;