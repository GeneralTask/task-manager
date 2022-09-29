import { useDrop } from 'react-dnd'
import styled, { css, keyframes } from 'styled-components'
import { Colors, Shadows, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { DropType } from '../../utils/types'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { useCalendarContext } from './CalendarContext'

const flicker = keyframes`
    from {opacity: 1;}
`
const Sidebar = styled.div<{ showFlicker: boolean }>`
    padding: ${Spacing._16} ${Spacing._4} 0;
    background-color: ${Colors.background.medium};
    cursor: pointer;
    z-index: 1;
    position: relative;
    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        box-shadow: ${Shadows.medium};
        ${(props) =>
            props.showFlicker
                ? css`
                      animation: ${flicker} 0.4s ease-in-out infinite alternate;
                  `
                : ''}
    }
`

interface CalendarHeaderProps {
    onClick: () => void
}
const CollapsedCalendarSidebar = ({ onClick }: CalendarHeaderProps) => {
    const { isTaskDraggingOverDetailsView, setIsCollapsed } = useCalendarContext()
    const [, drop] = useDrop(
        () => ({
            accept: [DropType.TASK],
            collect: (monitor) => {
                if (monitor.getItemType() === DropType.TASK && monitor.isOver()) {
                    setIsCollapsed(false)
                }
            },
        }),
        [setIsCollapsed]
    )
    return (
        <Sidebar onClick={onClick} showFlicker={isTaskDraggingOverDetailsView} ref={drop}>
            <GTIconButton icon={icons.calendar_blank} />
        </Sidebar>
    )
}

export default CollapsedCalendarSidebar
