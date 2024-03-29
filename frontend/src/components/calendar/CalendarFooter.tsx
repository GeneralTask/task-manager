import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import { Truncated } from '../atoms/typography/Typography'
import SettingsModalButton from '../molecules/SettingsModalButton'
import { useCalendarContext } from './CalendarContext'
import CalendarSelector from './CalendarSelector'
import { getCalendarName } from './utils/utils'

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
    const { calendarType } = useCalendarContext()
    return (
        <Container>
            <CalendarSelector
                mode="cal-selection"
                renderTrigger={() => <GTButton icon={icons.eye} tooltipText="Show/hide calendars" styleType="icon" />}
            />
            <TaskToCalContainer>
                <CalendarSelector
                    mode="task-to-cal"
                    renderTrigger={(calendar, accountId) => (
                        <GTButton
                            value={
                                <Truncated>
                                    {getCalendarName(accountId, calendar?.title) || 'Select a calendar'}
                                </Truncated>
                            }
                            icon={icons.square}
                            iconColorHex={calendar?.color_background || ''}
                            rightIcon={icons.caret_down_solid}
                            styleType="secondary"
                            fitContent={false}
                            tooltipText="Choose the default calendar to create new events in"
                        />
                    )}
                    useTriggerWidth={calendarType === 'week'}
                />
            </TaskToCalContainer>
            <SettingsModalButton type="icon-button" label="Calendar settings" defaultTabIndex={1} />
        </Container>
    )
}

export default CalendarFooter
