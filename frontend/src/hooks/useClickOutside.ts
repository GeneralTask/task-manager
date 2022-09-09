import { MouseEvent, MouseEventHandler, useEffect } from 'react'

export default function useClickOutside(ref: React.RefObject<HTMLElement>, handler: MouseEventHandler): void {
    useEffect(() => {
        const listener: EventListenerOrEventListenerObject = (event) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return
            }
            handler(event as unknown as MouseEvent)
        }
        document.addEventListener('click', listener, true)
        return () => {
            document.removeEventListener('click', listener, true)
        }
    }, [ref, handler])
}
