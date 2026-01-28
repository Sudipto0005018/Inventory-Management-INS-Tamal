import { useState, useEffect } from "react";

const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
};

export function useBreakpoint() {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const current = Object.entries(breakpoints).reduce((acc, [key, value]) => {
        if (width >= value) acc = key;
        return acc;
    }, "base");

    return current;
}
