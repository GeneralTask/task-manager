import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import GTIconButton from '../atoms/buttons/GTIconButton'
import CalendarSelector from './CalendarSelector'

const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${Colors.background.white};
    padding: ${Spacing._8};
`

const CalendarFooter = () => {
    return (
        <Container>
            <CalendarSelector
                mode="cal-selection"
                trigger={<GTIconButton icon={icons.eye} tooltipText="Show/hide calendars" />}
            />
        </Container>
    )
}

export default CalendarFooter
