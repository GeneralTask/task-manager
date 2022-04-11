import React, { useCallback, useEffect, useRef } from "react"
import { useDrop } from "react-dnd"
import styled from "styled-components"
import { useReorderTask } from "../../../services/api-query-hooks"
import { DropProps, ItemTypes } from "../../../utils/types"
import { DropIndicatorAbove } from "../TaskDropContainer"

const DropAreaContainer = styled.div`
    flex: 1;
`

interface DropAreaBelowProps {
    dropIndex: number
    taskSectionId: string
}

const DropAreaBelow = ({ dropIndex, taskSectionId }: DropAreaBelowProps) => {
    const dropRef = useRef<HTMLDivElement>(null)
    const { mutate: reorderTask } = useReorderTask()

    const onDrop = useCallback(
        async (item: DropProps) => {
            reorderTask({
                taskId: item.id,
                orderingId: dropIndex,
                dropSectionId: taskSectionId,
            })
        },
        [dropIndex, taskSectionId]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: ItemTypes.TASK,
            collect: (monitor) => {
                return !!monitor.isOver()
            },
            drop: onDrop,
        }), [onDrop]
    )

    useEffect(() => {
        drop(dropRef)
    }, [dropRef])

    return <DropAreaContainer ref={dropRef} >
        <DropIndicatorAbove isVisible={isOver} />
    </DropAreaContainer>
}

export default DropAreaBelow
