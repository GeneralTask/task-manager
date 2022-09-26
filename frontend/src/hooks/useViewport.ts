import { useState, useLayoutEffect } from 'react'

const useViewport = () => {
    const [width, setWidth] = useState(window.innerWidth);
    const [height, setHeight] = useState(window.innerHeight);

    useLayoutEffect(() => {
        const handleWindowResize = () => {
            setWidth(window.innerWidth);
            setHeight(window.innerHeight);
        };

        window.addEventListener('resize', handleWindowResize);

        return () => window.removeEventListener('resize', handleWindowResize);
    }, []);

    return { width, height };
}

export default useViewport
