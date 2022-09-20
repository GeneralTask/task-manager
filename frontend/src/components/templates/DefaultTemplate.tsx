import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { MEDIA_MAX_WIDTH, NAVIGATION_BAR_WIDTH, WINDOW_MIN_WIDTH } from '../../styles/dimensions'
import { useCalendarContext } from '../calendar/CalendarContext'
import CalendarView from '../views/CalendarView'
import NavigationView from '../views/NavigationView'

const DefaultTemplateContainer = styled.div`
    display: grid;
    grid-template-columns: ${NAVIGATION_BAR_WIDTH} minmax(300px, auto) max-content;
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
    const { calendarType } = useCalendarContext()

    return (
        <DefaultTemplateContainer>
            <ReactTooltip
                id="recipients-tooltip"
                effect="solid"
                delayShow={250}
                delayHide={250}
                delayUpdate={500}
                className="recipients-tooltip"
                backgroundColor={Colors.background.white}
                textColor={Colors.text.black}
            />
            <ReactTooltip
                id="tooltip"
                effect="solid"
                delayShow={250}
                delayUpdate={500}
                className="tooltip"
                backgroundColor={Colors.background.white}
                textColor={Colors.text.black}
            />
            <NavigationView />
            {calendarType === 'day' && <TasksandDetails>{children}</TasksandDetails>}
            <CalendarView initialType="day" />
        </DefaultTemplateContainer>
    )
}

export default DefaultTemplate
