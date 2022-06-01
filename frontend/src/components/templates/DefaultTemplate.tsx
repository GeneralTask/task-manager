import React from 'react'
import ReactTooltip from 'react-tooltip'
import { Colors } from '../../styles'
import NavigationView from '../views/NavigationView'
import '../../styles/tooltip.css'
import styled from 'styled-components'
import CalendarView from '../views/CalendarView'
import { NAVIGATION_BAR_WIDTH, COLLAPSED_CALENDAR_WIDTH, WINDOW_MIN_WIDTH } from '../../styles/dimensions'

const DefaultTemplateContainer = styled.div`
    display: grid;
    grid-template-columns: ${NAVIGATION_BAR_WIDTH}px minmax(300px, auto) minmax(
            ${COLLAPSED_CALENDAR_WIDTH}px,
            max-content
        );
    grid-auto-flow: column;
    grid-template-rows: 1fr;
    height: 100vh;
    background-color: ${Colors.gray._50};
    position: relative;
    min-width: ${WINDOW_MIN_WIDTH}px;
`

const TasksandDetails = styled.div`
    flex: 1;
    flex-direction: row;
    display: flex;
    position: relative;
    overflow: hidden;
    @media only screen and (min-device-width: 375px) and (max-device-width: 480px) {
        overflow: auto;
    }
`
interface DefaultTemplateProps {
    children: React.ReactNode
}

const DefaultTemplate = ({ children }: DefaultTemplateProps) => {
    return (
        <DefaultTemplateContainer>
            <ReactTooltip
                id="tooltip"
                effect="solid"
                delayShow={250}
                delayHide={250}
                delayUpdate={500}
                className="tooltip"
                backgroundColor={Colors.white}
                textColor={Colors.black}
            />
            <NavigationView />
            <TasksandDetails>{children}</TasksandDetails>
            <CalendarView />
        </DefaultTemplateContainer>
    )
}

export default DefaultTemplate
