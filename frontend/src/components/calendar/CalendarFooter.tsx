import styled from 'styled-components'
import { usePreviewMode } from '../../hooks'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Truncated } from '../atoms/typography/Typography'
import SettingsModalButton from '../molecules/SettingsModalButton'
import Tip from '../radix/Tip'
import { useCalendarContext } from './CalendarContext'
import CalendarSelector from './CalendarSelector'
import { getCalendarColor, getCalendarName } from './utils/utils'

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
    const { isPreviewMode } = usePreviewMode()
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
                    renderTrigger={(calendar, accountId) => (
                        <Tip content="Choose the default calendar to create new events in">
                            <GTButton
                                value={
                                    <Truncated>
                                        {getCalendarName(accountId, calendar?.title) || 'Select a calendar'}
                                    </Truncated>
                                }
                                icon={icons.square}
                                iconColorHex={
                                    isPreviewMode
                                        ? calendar?.color_background || ''
                                        : getCalendarColor(calendar?.color_id || '')
                                }
                                asDiv
                                isDropdown
                                styleType="secondary"
                                size="small"
                                fitContent={false}
                            />
                        </Tip>
                    )}
                    useTriggerWidth={calendarType === 'week'}
                />
            </TaskToCalContainer>
            <SettingsModalButton type="icon-button" label="Calendar settings" defaultTabIndex={1} />
        </Container>
    )
}

export default CalendarFooter
