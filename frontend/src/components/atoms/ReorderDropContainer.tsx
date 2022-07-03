import { DropItem, DropType } from '../../utils/types'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { Colors } from '../../styles'

const isLastStyle = css`
    flex: 1;
    min-height: 100px;
`
const DropOverlay = styled.div<{ isLast?: boolean }>`
    width: 100%;
    height: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    ${({ isLast }) => (isLast ? isLastStyle : '')}
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

enum DropDirection {
    ABOVE,
    BELOW,
}
interface ReorderDropContainerProps {
    children?: JSX.Element
    index: number
    acceptDropType: DropType
    isLast?: boolean
    onReorder: (item: DropItem, dropIndex: number) => void
}
const ReorderDropContainer = ({ children, index, acceptDropType, isLast, onReorder }: ReorderDropContainerProps) => {
    const dropRef = useRef<HTMLDivElement>(null)
    const [dropDirection, setDropDirection] = useState<DropDirection>(DropDirection.ABOVE)

    const getDropDirection = useCallback((dropY: number): DropDirection => {
        if (isLast) return DropDirection.ABOVE
        const boundingRect = dropRef.current?.getBoundingClientRect()
        if (!boundingRect) {
            return DropDirection.ABOVE
        }
        const midpoint = (boundingRect.top + boundingRect.bottom) / 2
        return dropY < midpoint ? DropDirection.ABOVE : DropDirection.BELOW
    }, [])

    const onDrop = useCallback(
        (item: DropItem, monitor: DropTargetMonitor) => {
            const dropDirection = getDropDirection(monitor.getClientOffset()?.y ?? 0)
            setDropDirection(dropDirection)
            const dropIndex = index + (dropDirection === DropDirection.ABOVE ? 1 : 2)
            onReorder(item, dropIndex)
        },
        [index, onReorder, isLast]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: acceptDropType,
            collect: (monitor) => {
                return !!monitor.isOver()
            },
            drop: onDrop,
            hover: async (_, monitor) => {
                setDropDirection(getDropDirection(monitor.getClientOffset()?.y ?? 0))
            },
        }),
        [onDrop, acceptDropType, getDropDirection]
    )

    useEffect(() => {
        drop(dropRef)
    }, [dropRef])

    return (
        <DropOverlay ref={dropRef} isLast={isLast}>
            <DropIndicatorAbove isVisible={isOver && dropDirection == DropDirection.ABOVE} />
            {children}
            <DropIndicatorBelow isVisible={isOver && dropDirection == DropDirection.BELOW && !isLast} />
        </DropOverlay>
    )
}

export default ReorderDropContainer
