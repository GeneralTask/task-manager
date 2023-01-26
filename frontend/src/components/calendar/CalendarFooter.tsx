import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Truncated } from '../atoms/typography/Typography'
import CalendarSelector from './CalendarSelector'

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${Spacing._8};
    background-color: ${Colors.background.white};
    padding: ${Spacing._8};
`

const CalendarFooter = () => {
    return (
        <Container>
            <CalendarSelector
                mode="cal-selection"
                trigger={<GTIconButton icon={icons.eye} tooltipText="Show/hide calendars" asDiv />}
            />
            <Truncated>
                <CalendarSelector
                    mode="task-to-cal"
                    trigger={
                        <GTButton
                            value="Your selected calendarrrrrrrdfasdfasdfadsfadsfadsfadssfas"
                            asDiv
                            isDropdown
                            styleType="secondary"
                            size="small"
                            fitContent={false}
                        />
                    }
                />
            </Truncated>
            <GTIconButton icon={icons.gear} tooltipText="Calendar settings" />
        </Container>
    )
}

export default CalendarFooter
