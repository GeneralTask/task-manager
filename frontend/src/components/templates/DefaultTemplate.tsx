import React from 'react'
import ReactTooltip from 'react-tooltip'
import { Colors } from '../../styles'
import NavigationView from '../views/NavigationView'
import '../../styles/tooltip.css'
import styled from 'styled-components'
import CalendarView from '../views/CalendarView'

const DefaultTemplateContainer = styled.div`
    display: grid;
    grid-template-columns: 230px minmax(300px, auto) minmax(40px, max-content);
    grid-auto-flow: column;
    grid-template-rows: 1fr;
    height: 100vh;
    background-color: ${Colors.gray._50};
    position: relative;
    min-width: 800px;
`

const TasksandDetails = styled.div`
    flex: 1;
    flex-direction: row;
    display: flex;
    position: relative;
    overflow: hidden;
`
interface DefaultTemplateProps {
    children: React.ReactNode
}

const DefaultTemplate = ({ children }: DefaultTemplateProps) => {
    return (
        <DefaultTemplateContainer>
            <NavigationView />
            <TasksandDetails>{children}</TasksandDetails>
            <CalendarView />
        </DefaultTemplateContainer>
    )
}

export default DefaultTemplate
