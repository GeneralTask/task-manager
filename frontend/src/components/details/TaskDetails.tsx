import React, { useEffect, useState } from 'react'
import ActionOption from '../molecules/ActionOption'
import { Icon } from '../atoms/Icon'
import { DETAILS_SYNC_TIMEOUT } from '../../constants'
import ReactTooltip from 'react-tooltip'
import { TTask } from '../../utils/types'
import { logos, icons, linearStatus } from '../../styles/images'
import { TModifyTaskData, useModifyTask } from '../../services/api/tasks.hooks'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { useCallback, useRef } from 'react'
import Spinner from '../atoms/Spinner'
import { useLocation, useNavigate } from 'react-router-dom'
import LinearCommentList from './linear/LinearCommentList'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import SlackMessage from './slack/SlackMessage'
import GTTextArea from '../atoms/GTTextArea'
import GTIconButton from '../atoms/buttons/GTIconButton'

const DetailsViewContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.background.light};
    min-width: 300px;
    padding: ${Spacing._32} ${Spacing._16} ${Spacing._16};
    gap: ${Spacing._8};
`
const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 50px;
`
const MarginLeftAuto = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: auto;
`
const MarginRight8 = styled.div`
    margin-right: ${Spacing._8};
`
const StatusContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._8};
    align-items: center;
    color: ${Colors.text.light};
    margin-bottom: ${Spacing._8};
    ${Typography.bodySmall};
`

const SYNC_MESSAGES = {
    SYNCING: 'Syncing...',
    ERROR: 'There was an error syncing with our servers',
    COMPLETE: '',
}

const TITLE_MAX_HEIGHT = 208
const BODY_MAX_HEIGHT = 200

interface TaskDetailsProps {
    task: TTask
    link: string
}
const TaskDetails = ({ task, link }: TaskDetailsProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [sectionEditorShown, setSectionEditorShown] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)

    const { mutate: modifyTask, isError, isLoading } = useModifyTask()
    const timers = useRef<{ [key: string]: { timeout: NodeJS.Timeout; callback: () => void } }>({})

    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (isEditing || isLoading) {
            setSyncIndicatorText(SYNC_MESSAGES.SYNCING)
        } else if (isError) {
            setSyncIndicatorText(SYNC_MESSAGES.ERROR)
        } else {
            setSyncIndicatorText(SYNC_MESSAGES.COMPLETE)
        }
    }, [isError, isLoading, isEditing])

    /* when the optimistic ID changes to undefined, we know that that task.id is now the real ID
    so we can then navigate to the correct link */
    useEffect(() => {
        if (!task.isOptimistic && location.pathname !== link) {
            navigate(link)
        }
    }, [task.isOptimistic, location, link])

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
        ({ id, title, body }: TModifyTaskData) => {
            setIsEditing(false)
            const timerId = id + (title === undefined ? 'body' : 'title')
            if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
            modifyTask({ id, title, body })
        },
        [task.id, modifyTask]
    )

    const onEdit = useCallback(
        ({ id, title, body }: TModifyTaskData) => {
            setIsEditing(true)
            const timerId = id + (title === undefined ? 'body' : 'title') // we're only modifying the body or title, one at a time
            if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
            timers.current[timerId] = {
                timeout: setTimeout(() => syncDetails({ id, title, body }), DETAILS_SYNC_TIMEOUT * 1000),
                callback: () => syncDetails({ id, title, body }),
            }
        },
        [syncDetails]
    )

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
                            <ActionOption
                                isShown={sectionEditorShown}
                                setIsShown={setSectionEditorShown}
                                task={task}
                                keyboardShortcut="showSectionEditor"
                            />
                            {task.deeplink && (
                                <NoStyleAnchor href={task.deeplink} target="_blank" rel="noreferrer">
                                    <GTIconButton icon={icons.external_link} />
                                </NoStyleAnchor>
                            )}
                        </MarginLeftAuto>
                    </>
                )}
            </DetailsTopContainer>
            <GTTextArea
                initialValue={task.title}
                disabled={task.isOptimistic}
                onEdit={(val) => onEdit({ id: task.id, title: val })}
                maxHeight={TITLE_MAX_HEIGHT}
                fontSize="large"
            />
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
                    <GTTextArea
                        initialValue={task.body}
                        placeholder="Add details"
                        isFullHeight={!task.slack_message_params}
                        onEdit={(val) => onEdit({ id: task.id, body: val })}
                        maxHeight={BODY_MAX_HEIGHT}
                        fontSize="small"
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
