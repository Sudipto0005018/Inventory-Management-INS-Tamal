import { useState, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";

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

const FALLBACK_IMAGE = "/images/fallback.jpg"; // local fallback path or external URL
const MISSING_PLACEHOLDER = (
  <div className="flex h-80 w-80 items-center justify-center rounded-md border bg-gray-50 text-gray-500">
    No image available
  </div>
);

const ImagePreviewDialog = ({ image, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleImgError = (e) => {
    e.currentTarget.onerror = null; // prevent infinite loop
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  const hasImages = Array.isArray(image) ? image.length > 0 : !!image;
  const firstSrc =
    Array.isArray(image) && image.length > 0
      ? `${imageBaseURL}${image[0]}`
      : FALLBACK_IMAGE;

  return (
    <div className="overflow-x-hidden">
      {!hasImages ? (
        // show placeholder when no image provided
        <div className="w-100 object-contain rounded-md border">
          {MISSING_PLACEHOLDER}
        </div>
      ) : (
        <>
          <Carousel
            className="relative"
            opts={{
              loop: true,
              dragFree: true,
            }}
          >
            <CarouselContent>
              {Array.isArray(image) ? (
                image.map((img, idx) => (
                  <CarouselItem key={idx}>
                    <div className="p-1">
                      <div className="flex aspect-square items-center justify-center p-6">
                        <img
                          src={`${imageBaseURL}${img}`}
                          alt={`product-${idx}`}
                          onError={handleImgError}
                          className={cn(
                            "max-w-full max-h-full object-contain",
                            className,
                          )}
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem>
                  <div className="p-1">
                    <div className="flex aspect-square items-center justify-center p-6">
                      <img
                        src={image}
                        alt="product"
                        onError={handleImgError}
                        className={cn(
                          "max-w-full max-h-full object-contain",
                          className,
                        )}
                      />
                    </div>
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselPrevious className="absolute top-1/2 left-0 -translate-y-1/2" />
            <CarouselNext className="absolute top-1/2 right-0 -translate-y-1/2" />
          </Carousel>

          <Dialog open={isOpen} onOpenChange={(set) => setIsOpen(set)}>
            <DialogContent onPointerDownOutside={() => {}}>
              <DialogTitle className="hidden" />
              <DialogDescription className="hidden" />
              {/* Show first image in dialog; use same error handler */}
              <img
                src={
                  Array.isArray(image) && image.length > 0
                    ? `${imageBaseURL}${image[0]}`
                    : image || FALLBACK_IMAGE
                }
                onError={handleImgError}
                alt="preview"
                className="w-full object-contain"
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default ImagePreviewDialog;
