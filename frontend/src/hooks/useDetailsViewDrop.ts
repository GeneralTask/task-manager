import { useEffect, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { DateTime } from 'luxon'
import { useCalendarContext } from '../components/calendar/CalendarContext'
import { DRAG_TASK_TO_OPEN_CALENDAR_TIMEOUT } from '../constants'
import { DropType } from '../utils/types'

const useDetailsViewDrop = (detailsViewContainerRef: React.RefObject<HTMLDivElement>) => {
    const hoverStarted = useRef<DateTime>()
    const { isCollapsed, setIsCollapsed, isTaskDraggingOverDetailsView, setIsTaskDraggingOverDetailsView } =
        useCalendarContext()

    const [, drop] = useDrop(
        () => ({
            accept: [DropType.TASK, DropType.NON_REORDERABLE_TASK],
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
                const dropType = monitor.getItemType()
                if (
                    !isCollapsed ||
                    !hoverStarted.current ||
                    (dropType !== DropType.TASK && dropType !== DropType.NON_REORDERABLE_TASK)
                )
                    return
                if (
                    monitor.isOver() &&
                    DateTime.now().diff(hoverStarted.current, 'seconds').seconds < DRAG_TASK_TO_OPEN_CALENDAR_TIMEOUT
                )
                    return
                setIsCollapsed(false)
                hoverStarted.current = undefined
            },
        }),
        [isCollapsed, isTaskDraggingOverDetailsView]
    )

    useEffect(() => {
        drop(detailsViewContainerRef)
    }, [])
}

export default useDetailsViewDrop
