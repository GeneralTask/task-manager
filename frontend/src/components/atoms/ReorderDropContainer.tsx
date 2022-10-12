import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import styled, { css } from 'styled-components'
import { Border, Colors } from '../../styles'
import { DropItem, DropType } from '../../utils/types'

const INDICATOR_HEIGHT = 2

const DropOverlay = styled.div<{ isLast?: boolean }>`
    position: relative;
    width: 100%;
    height: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    ${({ isLast }) => (isLast ? 'flex: 1;' : '')}
    cursor: pointer;
`
const DropIndicatorStyles = css<{ isVisible: boolean }>`
    position: relative;
    width: 100%;
    background-color: ${Colors.border.purple};
    visibility: ${(props) => (props.isVisible ? 'visible' : 'hidden')};
    position: absolute;
    height: ${INDICATOR_HEIGHT}px;
    z-index: 1;
    ::before {
        content: '';
        position: absolute;
        width: ${INDICATOR_HEIGHT * 3}px;
        height: ${INDICATOR_HEIGHT * 3}px;
        border-radius: 50%;
        background-color: ${Colors.border.purple};
        top: -${INDICATOR_HEIGHT}px;
        left: 0;
    }
`
const DropIndicatorAbove = styled.div`
    ${DropIndicatorStyles}
`
const DropIndicatorBelow = styled.div`
    ${DropIndicatorStyles}
    bottom: -${INDICATOR_HEIGHT}px;
`
const WholeDropIndicatorStyle = css`
    border: ${Border.stroke.medium} solid ${Colors.border.purple};
    border-radius: ${Border.radius.small};
`
const WholeDropIndicator = styled.div<{ isVisible: boolean }>`
    width: 100%;
    border: ${Border.stroke.medium} solid transparent;
    ${(props) => (props.isVisible ? WholeDropIndicatorStyle : '')}
`

type IndicatorType = 'TOP_AND_BOTTOM' | 'TOP_ONLY' | 'WHOLE'
enum DropDirection {
    ABOVE,
    BELOW,
}
interface ReorderDropContainerProps {
    children?: React.ReactElement
    index: number
    acceptDropType: DropType
    onReorder: (item: DropItem, dropIndex: number) => void
    indicatorType?: IndicatorType
}
const ReorderDropContainer = forwardRef(
    (
        { children, index, acceptDropType, onReorder, indicatorType = 'TOP_AND_BOTTOM' }: ReorderDropContainerProps,
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const dropRef = useRef<HTMLDivElement>(null)
        const [dropDirection, setDropDirection] = useState<DropDirection>(DropDirection.ABOVE)

        const getDropDirection = useCallback(
            (dropY: number): DropDirection => {
                if (indicatorType !== 'TOP_AND_BOTTOM') return DropDirection.ABOVE
                const boundingRect = dropRef.current?.getBoundingClientRect()
                if (!boundingRect) {
                    return DropDirection.ABOVE
                }
                const midpoint = (boundingRect.top + boundingRect.bottom) / 2
                return dropY < midpoint ? DropDirection.ABOVE : DropDirection.BELOW
            },
            [indicatorType]
        )

        const onDrop = useCallback(
            (item: DropItem, monitor: DropTargetMonitor) => {
                const dropDirection = getDropDirection(monitor.getClientOffset()?.y ?? 0)
                setDropDirection(dropDirection)
                const dropIndex = index + (dropDirection === DropDirection.ABOVE ? 1 : 2)
                onReorder(item, dropIndex)
            },
            [index, onReorder]
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
            <DropOverlay
                ref={(node) => {
                    drop(node)
                    if (typeof ref === 'function') {
                        ref(node)
                    } else if (ref !== null) {
                        ref.current = node
                    }
                }}
                isLast={indicatorType === 'TOP_ONLY'}
            >
                {indicatorType !== 'WHOLE' && (
                    <DropIndicatorAbove isVisible={isOver && dropDirection == DropDirection.ABOVE} />
                )}
                {indicatorType === 'WHOLE' ? (
                    <WholeDropIndicator isVisible={isOver}>{children}</WholeDropIndicator>
                ) : (
                    children
                )}
                {indicatorType === 'TOP_AND_BOTTOM' && (
                    <DropIndicatorBelow isVisible={isOver && dropDirection == DropDirection.BELOW} />
                )}
            </DropOverlay>
        )
    }
)

export default ReorderDropContainer
