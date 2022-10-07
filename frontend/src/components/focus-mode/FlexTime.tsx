import { useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { useCreateEvent } from '../../services/api/events.hooks'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
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

interface FlexTimeProps {
    nextEvent?: TEvent
}

const FlexTime = ({ nextEvent }: FlexTimeProps) => {
    const fifteenMinuteBlock = currentFifteenMinuteBlock(DateTime.local())
    const nextEventTime = nextEvent
        ? DateTime.fromISO(nextEvent.datetime_start)
        : DateTime.local().set({ hour: 23, minute: 59 }) //midnight
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
            let firstTask = undefined
            let secondTask = undefined
            if (views === undefined) {
                getNewRecommendedTasks()
                return
            }
            for (const view of views) {
                if (view.type === 'slack' || view.type === 'task_section' || view.type === 'linear') {
                    if (!firstTask) {
                        firstTask = view.view_items.length > 0 ? view.view_items[0] : undefined
                    }
                    if (!secondTask) {
                        secondTask = view.view_items.length > 1 ? view.view_items[1] : undefined
                    }
                }
                if (firstTask && secondTask) {
                    setRecommendedTasks([firstTask, secondTask])
                    break
                }
            }
            if (!firstTask && !secondTask) {
                getNewRecommendedTasks()
            }
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
    }

    return (
        <FlexTimeContainer>
            <GTHeader>Flex Time</GTHeader>
            <GTTitle>
                <TimeRange start={fifteenMinuteBlock} end={nextEventTime} />
            </GTTitle>
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
