import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import SettingsModalButton from '../molecules/SettingsModalButton'
import CalendarSelector from './CalendarSelector'

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: ${Colors.background.white};
    padding: 0 ${Spacing._8};
`
const TaskToCalContainer = styled.div`
    flex: 1;
    background-color: white;
    border-radius: 4px;
    padding: ${Spacing._8};
    overflow: hidden;
`

const CalendarFooter = () => {
    return (
        <Container>
            <CalendarSelector mode="cal-selection" />
            <TaskToCalContainer>
                <CalendarSelector mode="task-to-cal" />
            </TaskToCalContainer>
            <SettingsModalButton type="icon-button" label="Calendar settings" defaultTabIndex={1} />
        </Container>
    )
}

export default CalendarFooter
