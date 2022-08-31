import { DateTime } from 'luxon'
import { useEffect, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { useCalendarContext } from '../components/calendar/CalendarContext'
import { DropType } from '../utils/types'

const useDetailsViewDrop = (detailsViewContainerRef: React.RefObject<HTMLDivElement>) => {
    const hoverStarted = useRef<DateTime>()
    const { isCollapsed, setIsCollapsed, isTaskDraggingOverDetailsView, setIsTaskDraggingOverDetailsView } = useCalendarContext()

    const [, drop] = useDrop(
        () => ({
            accept: [DropType.TASK],
            collect: (monitor) => {
                if (isCollapsed) {
                    if (!isTaskDraggingOverDetailsView && monitor.isOver()) {
                        hoverStarted.current = DateTime.now()
                    }
                }
                if (!monitor.isOver()) {
                    hoverStarted.current = undefined
                }
                setIsTaskDraggingOverDetailsView(monitor.isOver())
            },
            hover: (_, monitor) => {
                if (!isCollapsed || !hoverStarted.current) return
                if (monitor.getItemType() === DropType.TASK && monitor.isOver() && DateTime.now().diff(hoverStarted.current, 'seconds').seconds < 2) return
                setIsCollapsed(false)
                hoverStarted.current = undefined
            }
        }),
        [isCollapsed, isTaskDraggingOverDetailsView]
    )

    useEffect(() => {
        drop(detailsViewContainerRef)
    }, [])
}

export default useDetailsViewDrop
