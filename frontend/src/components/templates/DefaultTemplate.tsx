import '../../styles/tooltip.css'

import CalendarView from '../views/CalendarView'
import { Colors } from '../../styles'
import NavigationView from '../views/NavigationView'
import React from 'react'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'

const DefaultTemplateContainer = styled.div`
    display: flex;
    height: 100vh;
    width: 100vw;
    background-color: ${Colors.gray._50};
    position: relative;
`

const TasksandDetails = styled.div`
    flex: 1;
    flex-direction: row;
    min-width: 0;
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
