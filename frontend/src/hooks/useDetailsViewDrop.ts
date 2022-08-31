import { DateTime } from "luxon"
import { useEffect, useRef, useState } from "react"
import { useDrop } from "react-dnd"
import { useCalendarContext } from "../components/calendar/CalendarContext"
import { DropType } from "../utils/types"

const useDetailsViewDrop = (detailsViewContainerRef: React.RefObject<HTMLDivElement>) => {
    const hoverStarted = useRef<DateTime>()
    const { isCollapsed, setIsCollapsed } = useCalendarContext()
    const [isOver, setIsOver] = useState(false)

    const [, drop] = useDrop(
        () => ({
            accept: [DropType.TASK],
            collect: (monitor) => {
                console.log({ isCollapsed })
                if (isCollapsed) {
                    if (!isOver && monitor.isOver()) {
                        hoverStarted.current = DateTime.now()
                    }
                }
                if (!monitor.isOver()) {
                    hoverStarted.current = undefined
                }
                setIsOver(monitor.isOver())
            },
            hover: (_, monitor) => {
                if (!isCollapsed || !hoverStarted.current) return
                if (monitor.getItemType() === DropType.TASK && monitor.isOver() && DateTime.now().diff(hoverStarted.current, 'seconds').seconds < 2) return
                setIsCollapsed(false)
                hoverStarted.current = undefined
            }
        }),
        [isCollapsed, isOver]
    )

    useEffect(() => {
        drop(detailsViewContainerRef)
    }, [])
}

export default useDetailsViewDrop
