import { useLayoutEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { useCreateEvent } from '../../services/api/events.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TEvent, TTask } from '../../utils/types'
import GTHeader from '../atoms/GTHeader'
import GTTitle from '../atoms/GTTitle'
import { Icon } from '../atoms/Icon'
import TimeRange from '../atoms/TimeRange'
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
`
const TaskTitle = styled.span`
    margin-left: ${Spacing._16};
`

const currentThirtyMinuteBlock = (currentTime: DateTime) => {
    // Round down to nearest 30 minutes
    const minutes = Math.floor(currentTime.minute / 30) * 30
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

interface FlexTimeProps {
    nextEvent?: TEvent
}

const FlexTime = ({ nextEvent }: FlexTimeProps) => {
    const thirtyMinuteBlock = currentThirtyMinuteBlock(DateTime.local())
    const nextEventTime = nextEvent
        ? DateTime.fromISO(nextEvent.datetime_start)
        : DateTime.local().set({ hour: 23, minute: 59 }) //midnight
    const { data: taskSections } = useGetTasks()
    const { mutate: createEvent } = useCreateEvent()
    const { data: linkedAccounts } = useGetLinkedAccounts()

    const [recommendedTasks, setRecommendedTasks] = useState<[TTask?, TTask?]>([])
    useLayoutEffect(() => {
        if (taskSections) {
            const allTasks = taskSections
                .filter((section) => !section.is_done && !section.is_trash)
                .flatMap((section) => section.tasks)
                .filter((task) => task.source.name === 'General Task')
            const [firstId, secondId] = getRandomUniqueTaskIds(allTasks.length)
            const firstTask = firstId !== undefined ? allTasks[firstId] : undefined
            const secondTask = secondId !== undefined ? allTasks[secondId] : undefined
            setRecommendedTasks([firstTask, secondTask])
        }
    }, [taskSections])

    const primaryAccountID = useMemo(
        () => linkedAccounts?.filter((account) => account.name === 'Google')?.[0]?.display_id,
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
                datetime_start: thirtyMinuteBlock.toISO(),
                datetime_end: thirtyMinuteBlock.plus({ hours: 1 }).toISO(),
                summary: task.title,
                description,
                task_id: task.id,
            },
            date: DateTime.local(),
            linkedTask: task,
            optimisticId: uuidv4(),
        })
    }

    return (
        <FlexTimeContainer>
            <GTHeader>Flex Time</GTHeader>
            <GTTitle>
                <TimeRange start={thirtyMinuteBlock} end={nextEventTime} />
            </GTTitle>
            <Subtitle>
                If you need something to work on, we’ve picked a couple tasks that you may be interested in doing now.
                You can click either one to get started, or have us pick a couple other options for you.
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
                                <ItemContainer isSelected={false} onClick={() => onClickHandler(task)}>
                                    <RecommendedTaskContainer>
                                        <Icon icon={logos.generaltask} />
                                        <TaskTitle>{task.title}</TaskTitle>
                                    </RecommendedTaskContainer>
                                </ItemContainer>
                            )
                    )}
                </RecommendedTasks>
            </TaskSelectionContainer>
        </FlexTimeContainer>
    )
}
export default FlexTime
