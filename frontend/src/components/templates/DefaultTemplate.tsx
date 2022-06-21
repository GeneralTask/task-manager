import '../../styles/tooltip.css'

import { MEDIA_MAX_WIDTH, NAVIGATION_BAR_WIDTH, WINDOW_MIN_WIDTH } from '../../styles/dimensions'

import CalendarView from '../views/CalendarView'
import { Colors } from '../../styles'
import NavigationView from '../views/NavigationView'
import React from 'react'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'
import { useAppSelector } from '../../redux/hooks'

const DefaultTemplateContainer = styled.div`
    display: grid;
    grid-template-columns: ${NAVIGATION_BAR_WIDTH} minmax(300px, auto) max-content;
    grid-auto-flow: column;
    grid-template-rows: 1fr;
    height: 100vh;
    background-color: ${Colors.gray._50};
    position: relative;
    min-width: ${WINDOW_MIN_WIDTH};
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
    const isCalendarExpanded = useAppSelector((state) => state.tasks_page.expanded_calendar)
    return (
        <DefaultTemplateContainer>
            <ReactTooltip
                id="recipients-tooltip"
                effect="solid"
                delayShow={250}
                delayHide={250}
                delayUpdate={500}
                className="recipients-tooltip"
                backgroundColor={Colors.white}
                textColor={Colors.black}
            />
            <ReactTooltip
                id="tooltip"
                effect="solid"
                delayShow={250}
                delayUpdate={500}
                className="tooltip"
                backgroundColor={Colors.white}
                textColor={Colors.black}
            />
            <NavigationView />
            {!isCalendarExpanded && <TasksandDetails>{children}</TasksandDetails>}
            <CalendarView isExpanded={isCalendarExpanded} />
        </DefaultTemplateContainer>
    )
}

export default DefaultTemplate
