import { useEffect, useState } from "react"
import { useDragDropManager } from "react-dnd"

// returns true if anything is being dragged
const useIsDragging = () => {
    const [isDragging, setIsDragging] = useState(false)
    const dragDropManager = useDragDropManager()
    useEffect(() => {
        const monitor = dragDropManager.getMonitor()
        const unsubscribe = monitor.subscribeToStateChange(() => {
            setIsDragging(monitor.isDragging())
        })
        return () => {
            unsubscribe()
        }
    }, [dragDropManager])
    return isDragging
}

export default useIsDragging
