import { useEffect, useState } from "react";

function useIsBrowserFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const checkFullscreen = () => {
    const isFull =
      window.innerHeight === screen.height &&
      window.innerWidth === screen.width;

    setIsFullscreen(isFull);
  };

  useEffect(() => {
    checkFullscreen();

    window.addEventListener("resize", checkFullscreen);
    return () => window.removeEventListener("resize", checkFullscreen);
  }, []);

  return isFullscreen;
}

export default useIsBrowserFullscreen;
