import { useLayoutEffect } from 'react'
import styled from 'styled-components'
import { useGTLocalStorage, useWindowSize } from '../../hooks'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { MEDIA_MAX_WIDTH, TOOLTIP_MAX_WIDTH, WINDOW_MIN_WIDTH } from '../../styles/dimensions'
import { useCalendarContext } from '../calendar/CalendarContext'
import CalendarWithTaskSelection from '../calendar/CalendarWithTaskSelection'
import NavigationView from '../views/NavigationView'

const COLLAPSE_BREAKPOINT = 1500

const DefaultTemplateContainer = styled.div`
    display: grid;
    grid-template-columns: min-content minmax(300px, auto) max-content;
    grid-auto-flow: column;
    grid-template-rows: 100%;
    height: 100vh;
    background-color: ${Colors.background.light};
    position: relative;
    min-width: ${WINDOW_MIN_WIDTH};
    a {
        color: ${Colors.gtColor.primary};
    }
    .tooltip {
        box-shadow: ${Shadows.light} !important;
        border-radius: ${Border.radius.medium} !important;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu,
            Cantarell, Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji',
            'Segoe UI Symbol' !important;
        ${Typography.bodySmall};
        padding: ${Spacing._8} !important;
        max-width: ${TOOLTIP_MAX_WIDTH};
    }
`

const TasksandDetails = styled.div`
    flex: 1;
    flex-direction: row;
    display: flex;
    position: relative;
    overflow: hidden;
    background-color: inherit;
    @media only screen and (max-device-width: ${MEDIA_MAX_WIDTH}) {
        overflow: auto;
    }
`
interface DefaultTemplateProps {
    children: React.ReactNode
}

const DefaultTemplate = ({ children }: DefaultTemplateProps) => {
    const { width } = useWindowSize(false)
    const { calendarType, isCollapsed: isCalCollapsed, setIsCollapsed: setIsCalCollapsed } = useCalendarContext()
    const [isNavCollapsed, setIsNavCollapsed] = useGTLocalStorage('navigationCollapsed', false)

    useLayoutEffect(() => {
        if (!width) return
        if (width < COLLAPSE_BREAKPOINT) {
            if (!isNavCollapsed) setIsNavCollapsed(true)
            if (!isCalCollapsed) setIsCalCollapsed(true)
        }
        if (width > COLLAPSE_BREAKPOINT) {
            if (isNavCollapsed) setIsNavCollapsed(false)
            if (isCalCollapsed) setIsCalCollapsed(false)
        }
    }, [width])

    return (
        <DefaultTemplateContainer>
            <NavigationView isCollapsed={isNavCollapsed} setIsCollapsed={setIsNavCollapsed} />
            {calendarType === 'day' && <TasksandDetails>{children}</TasksandDetails>}
            <CalendarWithTaskSelection />
        </DefaultTemplateContainer>
    )
}

export default DefaultTemplate
