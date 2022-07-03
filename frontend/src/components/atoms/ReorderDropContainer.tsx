import { DropProps, DropType } from '../../utils/types'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import { Colors } from '../../styles'

const DropOverlay = styled.div`
    width: 100%;
    height: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
`
const DropIndicatorStyles = css<{ isVisible: boolean }>`
    width: 100%;
    background-color: ${Colors.gray._800};
    visibility: ${(props) => (props.isVisible ? 'visible' : 'hidden')};
    position: relative;
    height: 2px;
`
export const DropIndicatorAbove = styled.div`
    ${DropIndicatorStyles}
`
const DropIndicatorBelow = styled.div`
    ${DropIndicatorStyles}
    top: 2px;
`

interface ReorderDropContainerProps {
    children: JSX.Element
    index: number
    onReorder: (item: DropProps, dropIndex: number) => void
}
enum DropDirection {
    ABOVE,
    BELOW,
}

const ReorderDropContainer: React.FC<ReorderDropContainerProps> = ({
    children,
    index,
    onReorder,
}: ReorderDropContainerProps) => {
    const dropRef = useRef<HTMLDivElement>(null)
    const [dropDirection, setDropDirection] = useState<DropDirection>(DropDirection.ABOVE)

    const getAndUpdateDropDirection = useCallback((dropY: number): DropDirection => {
        const boundingRect = dropRef.current?.getBoundingClientRect()
        if (!boundingRect) {
            return DropDirection.ABOVE
        }
        const midpoint = (boundingRect.top + boundingRect.bottom) / 2
        const dropDirection = dropY < midpoint ? DropDirection.ABOVE : DropDirection.BELOW
        setDropDirection(dropDirection)
        return dropDirection
    }, [])

    const onDrop = useCallback(
        async (item: DropProps, monitor: DropTargetMonitor) => {
            const dropDirection = await getAndUpdateDropDirection(monitor.getClientOffset()?.y ?? 0)

            const dropIndex = index + (dropDirection === DropDirection.ABOVE ? 1 : 2)

            onReorder(item, dropIndex)
        },
        [index]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: DropType.TASK,
            collect: (monitor) => {
                return !!monitor.isOver()
            },
            drop: onDrop,
            hover: async (_, monitor) => getAndUpdateDropDirection(monitor.getClientOffset()?.y ?? 0),
        }),
        [onDrop]
    )

    useEffect(() => {
        drop(dropRef)
    }, [dropRef])

    return (
        <DropOverlay ref={dropRef}>
            <DropIndicatorAbove isVisible={isOver && dropDirection == DropDirection.ABOVE} />
            {children}
            <DropIndicatorBelow isVisible={isOver && dropDirection == DropDirection.BELOW} />
        </DropOverlay>
    )
}

export default ReorderDropContainer
