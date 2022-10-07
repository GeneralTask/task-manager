import { useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../constants'
import { useCreateEvent, useGetEvents } from '../../services/api/events.hooks'
import Log from '../../services/api/log'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { getMonthsAroundDate } from '../../utils/time'
import { TEvent, TTask } from '../../utils/types'
import GTHeader from '../atoms/GTHeader'
import GTTitle from '../atoms/GTTitle'
import { Icon } from '../atoms/Icon'
import ItemContainer from '../molecules/ItemContainer'

const FlexTimeContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._32};
`
const Subtitle = styled.div`
    ${Typography.subtitle};
`
const TaskSelectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._24};
`
const EyebrowHeader = styled.span`
    ${Typography.eyebrow};
`
const RecommendedTasks = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`
const RecommendedTaskContainer = styled.div`
    display: flex;
    padding: ${Spacing._8} 0;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
`
const TaskTitle = styled.span`
    margin-left: ${Spacing._16};
    overflow: hidden;
    text-overflow: ellipsis;
`
const NewTaskRecommendationsButton = styled.div`
    color: ${Colors.text.purple};
    ${Typography.bodySmall};
    cursor: pointer;
    user-select: none;
`

const currentFifteenMinuteBlock = (currentTime: DateTime) => {
    // Round down to nearest 15 minutes
    const minutes = Math.floor(currentTime.minute / 15) * 15
    return DateTime.local().set({ minute: minutes, second: 0, millisecond: 0 })
}

const getRandomUniqueTaskIds = (tasksLength: number): [number?, number?] => {
    if (tasksLength === 0) {
        return [undefined, undefined]
    } else if (tasksLength === 1) {
        return [0, undefined]
    } else if (tasksLength === 2) {
        return [0, 1]
    }
    const taskIds: [number?, number?] = []
    while (taskIds.length < 3) {
        const randomId = Math.floor(Math.random() * tasksLength)
        if (!taskIds.includes(randomId)) {
            taskIds.push(randomId)
        }
    }
    return taskIds
}

const getFlexTimeText = (events: TEvent[], nextEvent?: TEvent) => {
    const latestPriorEvent = events.filter((event) => DateTime.fromISO(event.datetime_end) < DateTime.local()).pop()
    //check if event ends after 11:30AM
    const eventEndedBeforeMorningCutoff =
        latestPriorEvent &&
        DateTime.fromISO(latestPriorEvent.datetime_end).hour < 11 &&
        DateTime.fromISO(latestPriorEvent.datetime_end).minute < 30
    if (!latestPriorEvent && !nextEvent) {
        return 'All day'
    } else if (latestPriorEvent && nextEvent) {
        const formattedStart = DateTime.fromISO(latestPriorEvent.datetime_end).toLocaleString(DateTime.TIME_SIMPLE)
        const formattedEnd = DateTime.fromISO(nextEvent.datetime_start).toLocaleString(DateTime.TIME_SIMPLE)
        return `${formattedStart} - ${formattedEnd}`
    } else if (!nextEvent && eventEndedBeforeMorningCutoff) {
        return 'Starting at 11:30am'
    } else if (nextEvent) {
        const formattedEnd = DateTime.fromISO(nextEvent.datetime_start).toLocaleString(DateTime.TIME_SIMPLE)
        return `Until ${formattedEnd}`
    }
    return 'Until Midnight'
}

interface FlexTimeProps {
    nextEvent?: TEvent
}

const FlexTime = ({ nextEvent }: FlexTimeProps) => {
    const date = DateTime.local()
    const monthBlocks = useMemo(() => {
        const blocks = getMonthsAroundDate(date, 1)
        return blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    }, [date])
    const { data: eventsCurrentMonth } = useGetEvents(monthBlocks[1], 'calendar')
    const todayEvents = eventsCurrentMonth?.filter((event) =>
        DateTime.fromISO(event.datetime_start).hasSame(date, 'day')
    )
    const flexTimeText = getFlexTimeText(todayEvents ?? [], nextEvent)

    const fifteenMinuteBlock = currentFifteenMinuteBlock(DateTime.local())
    const { data: taskSections } = useGetTasks()
    const { mutate: createEvent } = useCreateEvent()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const { data: views } = useGetOverviewViews()

    const [recommendedTasks, setRecommendedTasks] = useState<[TTask?, TTask?]>([])

    const getNewRecommendedTasks = useCallback(() => {
        if (!taskSections) return
        const allTasks = taskSections
            .filter((section) => !section.is_done && !section.is_trash)
            .flatMap((section) => section.tasks)
        const [firstId, secondId] = getRandomUniqueTaskIds(allTasks.length)
        const firstTask = firstId !== undefined ? allTasks[firstId] : undefined
        const secondTask = secondId !== undefined ? allTasks[secondId] : undefined
        setRecommendedTasks([firstTask, secondTask])
    }, [taskSections, views])

    useLayoutEffect(() => {
        if (!recommendedTasks[0] && !recommendedTasks[1]) {
            if (views === undefined) {
                getNewRecommendedTasks()
                return
            }
            const allViewTasks = views
                .filter((view) => view.type === 'slack' || view.type === 'task_section' || view.type === 'linear')
                .flatMap((view) => view.view_items)
            const firstTask = allViewTasks.length > 0 ? allViewTasks[0] : undefined
            const secondTask = allViewTasks.length > 1 ? allViewTasks[1] : undefined
            setRecommendedTasks([firstTask, secondTask])
            if (!firstTask && !secondTask) {
                getNewRecommendedTasks()
            }
        }
    }, [taskSections])

    const primaryAccountID = useMemo(
        () =>
            linkedAccounts?.filter((account) => account.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME)?.[0]?.display_id,
        [linkedAccounts]
    )

    const onClickHandler = (task: TTask) => {
        if (!primaryAccountID) return
        let description = task.body
        if (description !== '') {
            description += '\n'
        }
        description = description.replaceAll('\n', '<br>')
        description += '<a href="https://generaltask.com/" __is_owner="true">created by General Task</a>'
        createEvent({
            createEventPayload: {
                account_id: primaryAccountID,
                datetime_start: fifteenMinuteBlock.toISO(),
                datetime_end: fifteenMinuteBlock.plus({ hours: 1 }).toISO(),
                summary: task.title,
                description,
                task_id: task.id,
            },
            date: DateTime.local(),
            linkedTask: task,
            optimisticId: uuidv4(),
        })
        Log(`flex_time_create_event_from_task`)
    }

    return (
        <FlexTimeContainer>
            <GTHeader>Flex Time</GTHeader>
            <GTTitle>{flexTimeText}</GTTitle>
            <Subtitle>
                If you need something to work on, we&apos;ve picked a couple tasks that you may be interested in doing
                now. You can click either one to get started, or have us pick a couple other options for you.
                <br />
                <br />
                Remember, you can always schedule tasks by dragging them onto the calendar before entering Focus Mode.
            </Subtitle>
            <TaskSelectionContainer>
                <EyebrowHeader>Chosen for you — Click to get started</EyebrowHeader>
                <RecommendedTasks>
                    {recommendedTasks.map(
                        (task) =>
                            task && (
                                <ItemContainer key={task.id} isSelected={false} onClick={() => onClickHandler(task)}>
                                    <RecommendedTaskContainer>
                                        <Icon icon={logos.generaltask} />
                                        <TaskTitle>{task.title}</TaskTitle>
                                    </RecommendedTaskContainer>
                                </ItemContainer>
                            )
                    )}
                </RecommendedTasks>
                <NewTaskRecommendationsButton onClick={getNewRecommendedTasks}>
                    Find me something else to work on
                </NewTaskRecommendationsButton>
            </TaskSelectionContainer>
        </FlexTimeContainer>
    )
}
export default FlexTime
