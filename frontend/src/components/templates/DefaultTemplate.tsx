import React from 'react'
import ReactTooltip from 'react-tooltip'
import { Colors } from '../../styles'
import NavigationView from '../views/NavigationView'
import '../../styles/tooltip.css'
import styled from 'styled-components'
import CalendarView from '../views/CalendarView'

const DefaultTemplateContainer = styled.div`
    display: flex;
    height: 100vh;
    background-color: ${Colors.gray._50};
    position: relative;
`

const TasksandDetails = styled.div`
    flex: 1;
    flex-direction: row;
    display: flex;
    position: relative;
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
