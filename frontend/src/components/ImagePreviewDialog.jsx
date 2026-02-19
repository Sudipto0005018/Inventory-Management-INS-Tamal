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

const ImagePreviewDialog = ({ image, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  // const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));
  return (
    <div className="overflow-x-hidden">
      {/* <img
                className={cn("w-12 cursor-pointer", className, className ? "" : "h-12")}
                src={image}
                alt={image}
                onClick={() => setIsOpen(true)}
            /> */}
      <Carousel
        // plugins={[plugin.current]}
        className="relative"
        opts={{
          loop: true,
          dragFree: true,
        }}
        // onMouseEnter={plugin.current.stop}
        // onMouseLeave={plugin.current.play}
      >
        <CarouselContent>
          {/* {Array.from({ length: 5 }).map((_, index) => (
                        <CarouselItem key={index}>
                            <div className="p-1">
                                <div className="flex aspect-square items-center justify-center p-6">
                                    <span className="text-4xl font-semibold">{index + 1}</span>
                                </div>
                            </div>
                        </CarouselItem>
                    ))} */}
          {image &&
            image.map((img, idx) => (
              <CarouselItem key={idx}>
                <div className="p-1">
                  <div className="flex aspect-square items-center justify-center p-6">
                    <img src={`${imageBaseURL}${img}`} />
                  </div>
                </div>
              </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious className="absolute top-1/2 left-0 -translate-y-1/2" />
        <CarouselNext className="absolute top-1/2 right-0 -translate-y-1/2" />
      </Carousel>
      <Dialog open={isOpen} onOpenChange={(set) => setIsOpen(set)}>
        <DialogContent onPointerDownOutside={() => {}}>
          <DialogTitle className="hidden" />
          <DialogDescription className="hidden" />
          <img src={image} className="w-full" alt={image} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImagePreviewDialog;
