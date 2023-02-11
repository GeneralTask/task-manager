import { useState } from 'react'
import { DateTime } from 'luxon'
import { Spacing } from '../../../styles'
import { icons, logos } from '../../../styles/images'
import { TEvent } from '../../../utils/types'
import Flex from '../../atoms/Flex'
import GTInput from '../../atoms/GTInput'
import GTTextField from '../../atoms/GTTextField'
import { Icon } from '../../atoms/Icon'
import GTButton from '../../atoms/buttons/GTButton'
import GTIconButton from '../../atoms/buttons/GTIconButton'
import { Label, Truncated } from '../../atoms/typography/Typography'
import { EventBoxStyle, EventHeader, EventHeaderIcons, FlexAnchor } from '../../molecules/EventDetailPopover-styles'
import CalendarSelector from '../CalendarSelector'
import { getCalendarColor, getCalendarName } from '../utils/utils'

interface CreateEventProps {
    event: TEvent
    setEvent: (event: TEvent) => void
    onCancel: () => void
}
const CreateEvent = ({ event, onCancel }: CreateEventProps) => {
    const [title, setTitle] = useState(event.title)
    const [description, setDescription] = useState(event.body)

    const startTime = DateTime.fromISO(event.datetime_start)
    const startTimeString = startTime.toFormat('h:mm')
    const endTimeString = DateTime.fromISO(event.datetime_end).toFormat('h:mm a')

    return (
        <EventBoxStyle onClick={(e) => e.stopPropagation()}>
            <EventHeader>
                <Icon icon={logos[event.logo]} />
                <EventHeaderIcons>
                    <GTIconButton icon={icons.x} tooltipText="Cancel" onClick={onCancel} />
                </EventHeaderIcons>
            </EventHeader>
            {/* <EventTitle>{event.title}</EventTitle> */}
            <GTInput value={title} onChange={setTitle} placeholder="Event title" />
            {/* {calendarAccount && calendar && (
                <Flex gap={Spacing._8}>
                    <Icon icon={icons.square} colorHex={getCalendarColor(event.color_id || calendar.color_id)} />
                    <Label>
                        {calendar.title && calendar.title !== calendarAccount.account_id
                            ? `${calendar.title} (${calendarAccount.account_id})`
                            : calendarAccount.account_id}
                    </Label>
                </Flex>
            )} */}
            {/* <GTDatePicker initialDate={s} setDate={d => ss(DateTime.fromISO(d))} /> */}
            <CalendarSelector
                mode="task-to-cal"
                renderTrigger={(calendar, accountId) => (
                    <GTButton
                        value={
                            <Truncated>{getCalendarName(accountId, calendar?.title) || 'Select a calendar'}</Truncated>
                        }
                        icon={icons.square}
                        iconColorHex={getCalendarColor(calendar?.color_id || '')}
                        asDiv
                        isDropdown
                        styleType="secondary"
                        size="small"
                        fitContent={false}
                    />
                )}
                useTriggerWidth
            />
            <Flex gap={Spacing._8} alignItems="center">
                <Icon icon={icons.calendar_blank} />
                <Label>
                    {`${startTime.toFormat('cccc, LLLL d')}`} · {`${startTimeString} - ${endTimeString}`}
                </Label>
            </Flex>
            <Label color="light">Drag the event on the calendar to change time</Label>
            <GTTextField
                type="plaintext"
                value={description}
                onChange={setDescription}
                fontSize="small"
                maxHeight={400}
            />
            {event.conference_call.logo && (
                <Flex flex="1" alignItems="center">
                    <FlexAnchor href={event.conference_call.url}>
                        <GTButton
                            styleType="secondary"
                            size="small"
                            value="Join"
                            icon={event.conference_call.logo}
                            fitContent={false}
                        />
                    </FlexAnchor>
                </Flex>
            )}
        </EventBoxStyle>
    )
}

export default CreateEvent
