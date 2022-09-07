import React, { useEffect, useLayoutEffect, useState } from 'react'
import ActionOption from '../molecules/ActionOption'
import { Icon } from '../atoms/Icon'
import { DETAILS_SYNC_TIMEOUT } from '../../constants'
import ReactTooltip from 'react-tooltip'
import { TTask } from '../../utils/types'
import { logos, icons, linearStatus } from '../../styles/images'
import { useModifyTask } from '../../services/api/tasks.hooks'
import GTButton from '../atoms/buttons/GTButton'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { useCallback, useRef } from 'react'
import Spinner from '../atoms/Spinner'
import { useLocation, useNavigate } from 'react-router-dom'
import LinearCommentList from './linear/LinearCommentList'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import SlackMessage from './slack/SlackMessage'
import TimeRange from '../atoms/TimeRange'
import { MeetingStartText } from '../atoms/MeetingStartText'

// This constant is used to shrink the task body so that the text is centered AND a scrollbar doesn't appear when typing.
const BODY_HEIGHT_OFFSET = 16

const DetailsViewContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.background.light};
    min-width: 300px;
    padding: ${Spacing.padding._40} ${Spacing.padding._16} ${Spacing.padding._16};
`
const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 50px;
`
const BodyTextArea = styled.textarea<{ isFullHeight: boolean }>`
    ${({ isFullHeight }) => isFullHeight && `flex: 1;`}
    display: block;
    background-color: inherit;
    border: ${Border.stroke.medium} solid transparent;
    border-radius: ${Border.radius.large};
    resize: none;
    outline: none;
    overflow: auto;
    padding: ${Spacing.padding._12};
    font: inherit;
    color: ${Colors.text.light};
    ${Typography.bodySmall};
    :focus,
    :hover {
        border: ${Border.stroke.medium} solid ${Colors.background.dark};
        box-shadow: ${Shadows.medium};
    }
`
const TitleInput = styled.textarea`
    background-color: inherit;
    color: ${Colors.text.light};
    font: inherit;
    border: none;
    resize: none;
    outline: none;
    overflow: hidden;
    margin-bottom: ${Spacing.margin._16};
    :focus {
        outline: 1px solid ${Colors.background.dark};
    }
    ${Typography.subtitle};
`
const MarginLeftAuto = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: auto;
`
const MarginRight8 = styled.div`
    margin-right: ${Spacing.margin._8};
`
const StatusContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.margin._8};
    align-items: center;
    color: ${Colors.text.light};
    margin-bottom: ${Spacing.margin._8};
    ${Typography.bodySmall};
`

const MeetingPreparationTimeContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.margin._24};
`

const SYNC_MESSAGES = {
    SYNCING: 'Syncing...',
    ERROR: 'There was an error syncing with our servers',
    COMPLETE: '',
}

interface TaskDetailsProps {
    task: TTask
    link: string
    isMeetingPreparation?: boolean
    startTime?: Date
    endTime?: Date
}
const TaskDetails = ({ task, link, isMeetingPreparation = false, startTime, endTime }: TaskDetailsProps) => {
    const [titleInput, setTitleInput] = useState('')
    const [bodyInput, setBodyInput] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [labelEditorShown, setLabelEditorShown] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)

    const titleRef = useRef<HTMLTextAreaElement>(null)
    const bodyRef = useRef<HTMLTextAreaElement>(null)

    const { mutate: modifyTask, isError, isLoading } = useModifyTask()
    const timers = useRef<{ [key: string]: { timeout: NodeJS.Timeout; callback: () => void } }>({})

    const navigate = useNavigate()
    const location = useLocation()

    const [meetingStartText, setMeetingStartText] = useState<string | null>(null)
    const [counter, setCounter] = useState(0)

    useEffect(() => {
        if (startTime != undefined) {
            const diff = startTime.getTime() - Date.now()
            const minutes = Math.floor(diff / 1000 / 60)
            if (minutes < 0) {
                setMeetingStartText('Meeting is now')
            } else if (minutes <= 30) {
                setMeetingStartText(`Starts in ${minutes} minutes`)
            } else {
                setMeetingStartText('')
            }
        }
    }, [counter, startTime])

    useEffect(() => {
        const interval = setInterval(() => {
            setCounter((counter) => counter + 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (isEditing || isLoading) {
            setSyncIndicatorText(SYNC_MESSAGES.SYNCING)
        } else if (isError) {
            setSyncIndicatorText(SYNC_MESSAGES.ERROR)
        } else {
            setSyncIndicatorText(SYNC_MESSAGES.COMPLETE)
        }
    }, [isError, isLoading, isEditing])

    // Update the state when the task changes
    useLayoutEffect(() => {
        setTitleInput(task.title)
        setBodyInput(task.body)
    }, [task.id])

    /* when the optimistic ID changes to undefined, we know that that task.id is now the real ID
    so we can then navigate to the correct link */
    useEffect(() => {
        if (!task.isOptimistic && location.pathname !== link) {
            navigate(link)
        }
    }, [task.isOptimistic, location, link])

    useLayoutEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = '0px'
            titleRef.current.style.height =
                titleRef.current.scrollHeight > 300 ? '300px' : `${titleRef.current.scrollHeight}px`
        }
    }, [titleInput])

    useLayoutEffect(() => {
        if (bodyRef.current && task.slack_message_params) {
            bodyRef.current.style.height = '0px'
            bodyRef.current.style.height =
                bodyRef.current.scrollHeight > 300 ? '300px' : `${bodyRef.current.scrollHeight - BODY_HEIGHT_OFFSET}px`
        }
    }, [bodyInput])

    useEffect(() => {
        ReactTooltip.rebuild()
        return () => {
            for (const timer of Object.values(timers.current)) {
                timer.callback()
                clearTimeout(timer.timeout)
            }
        }
    }, [])

    const syncDetails = useCallback(
        (taskId: string, title: string, body: string) => {
            setIsEditing(false)
            if (timers.current[taskId]) clearTimeout(timers.current[taskId].timeout)
            modifyTask({ id: taskId, title, body })
        },
        [task.id, modifyTask]
    )

    const onEdit = useCallback(
        (taskId: string, title: string, body: string) => {
            setIsEditing(true)
            if (timers.current[taskId]) clearTimeout(timers.current[taskId].timeout)
            timers.current[taskId] = {
                timeout: setTimeout(() => syncDetails(taskId, title, body), DETAILS_SYNC_TIMEOUT * 1000),
                callback: () => syncDetails(taskId, title, body),
            }
        },
        [syncDetails]
    )

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (titleRef.current && (e.key === 'Enter' || e.key === 'Escape')) titleRef.current.blur()
        e.stopPropagation()
    }

    const status = task.external_status ? task.external_status.state : ''

    return (
        <DetailsViewContainer data-testid="details-view-container">
            <DetailsTopContainer>
                <MarginRight8>
                    <Icon icon={logos[task.source.logo_v2]} size="small" />
                </MarginRight8>
                {!task.isOptimistic && (
                    <>
                        <SubtitleSmall>{syncIndicatorText}</SubtitleSmall>
                        <MarginLeftAuto>
                            {!isMeetingPreparation && (
                                <ActionOption
                                    isShown={labelEditorShown}
                                    setIsShown={setLabelEditorShown}
                                    task={task}
                                    keyboardShortcut="showLabelEditor"
                                />
                            )}
                            {task.deeplink && (
                                <NoStyleAnchor href={task.deeplink} target="_blank" rel="noreferrer">
                                    <GTButton
                                        styleType="secondary"
                                        value={task.source.name}
                                        icon={icons.external_link}
                                    />
                                </NoStyleAnchor>
                            )}
                        </MarginLeftAuto>
                    </>
                )}
            </DetailsTopContainer>
            <TitleInput
                disabled={task.isOptimistic || isMeetingPreparation}
                ref={titleRef}
                data-testid="task-title-input"
                onKeyDown={handleKeyDown}
                value={titleInput}
                onChange={(e) => {
                    setTitleInput(e.target.value)
                    onEdit(task.id, titleRef.current?.value || '', bodyRef.current?.value || '')
                }}
            />
            {startTime && endTime && (
                <MeetingPreparationTimeContainer>
                    <TimeRange start={startTime} end={endTime} />
                    <MeetingStartText isTextColored>{meetingStartText}</MeetingStartText>
                </MeetingPreparationTimeContainer>
            )}
            {task.external_status && (
                <StatusContainer>
                    <Icon icon={linearStatus[task.external_status.type]} size="small" />
                    {status}
                </StatusContainer>
            )}
            {task.isOptimistic ? (
                <Spinner />
            ) : (
                <>
                    <BodyTextArea
                        ref={bodyRef}
                        data-testid="task-body-input"
                        placeholder="Add task details"
                        isFullHeight={!task.slack_message_params}
                        value={bodyInput}
                        onChange={(e) => {
                            setBodyInput(e.target.value)
                            onEdit(task.id, titleRef.current?.value || '', bodyRef.current?.value || '')
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                    {task.comments && <LinearCommentList comments={task.comments} />}
                    {task.slack_message_params && (
                        <SlackMessage sender={task.sender} slack_message_params={task.slack_message_params} />
                    )}
                </>
            )}
        </DetailsViewContainer>
    )
}

export default TaskDetails
