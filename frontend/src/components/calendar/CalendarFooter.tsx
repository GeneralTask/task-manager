import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Truncated } from '../atoms/typography/Typography'
import SettingsModalButton from '../molecules/SettingsModalButton'
import { useCalendarContext } from './CalendarContext'
import CalendarSelector from './CalendarSelector'
import { DEFAULT_CALENDAR_COLOR, calendarColors } from './utils/colors'

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
                renderTrigger={() => <GTIconButton icon={icons.eye} tooltipText="Show/hide calendars" asDiv />}
            />
            <TaskToCalContainer>
                <CalendarSelector
                    mode="task-to-cal"
                    renderTrigger={(calendar) => (
                        <GTButton
                            value={<Truncated>{calendar?.title || 'Select a calendar'}</Truncated>}
                            icon={icons.square}
                            iconColorHex={
                                calendarColors[calendar?.color_id as keyof typeof calendarColors]?.background ??
                                DEFAULT_CALENDAR_COLOR
                            }
                            asDiv
                            isDropdown
                            styleType="secondary"
                            size="small"
                            fitContent={false}
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
