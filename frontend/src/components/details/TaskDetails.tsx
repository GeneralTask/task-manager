import React, { useEffect, useLayoutEffect, useState } from 'react'
import ActionOption from '../molecules/ActionOption'
import { Icon } from '../atoms/Icon'
import { DETAILS_SYNC_TIMEOUT, KEYBOARD_SHORTCUTS } from '../../constants'
import ReactTooltip from 'react-tooltip'
import { TTask } from '../../utils/types'
import { logos } from '../../styles/images'
import { useModifyTask } from '../../services/api-query-hooks'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { useCallback, useRef } from 'react'

const DetailsViewContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
    min-width: 300px;
    margin-top: ${Spacing.margin._24}px;
    padding: ${Spacing.padding._16}px;
`
const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 50px;
`
const BodyContainer = styled.div`
    flex: 1;
`
export const BodyTextArea = styled.textarea`
    width: 100%;
    height: 100%;
    display: block;
    background-color: inherit;
    border: 1px solid transparent;
    resize: none;
    outline: none;
    overflow: auto;
    padding: ${Spacing.margin._8}px;
    font: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize};
    box-sizing: border-box;
    :focus {
        border: 1px solid ${Colors.gray._500};
    }
`
export const TitleInput = styled.textarea`
    background-color: inherit;
    color: ${Colors.gray._600};
    font: inherit;
    font-size: ${Typography.large.fontSize};
    font-weight: ${Typography.weight._600};
    border: none;
    resize: none;
    outline: none;
    overflow: hidden;
    margin-bottom: ${Spacing.margin._16}px;
    :focus {
        outline: 1px solid ${Colors.gray._500};
    }
`
const SYNC_MESSAGES = {
    SYNCING: 'Syncing...',
    ERROR: 'There was an error syncing with our servers',
    COMPLETE: '',
}

const MarginLeftAuto = styled.div`
    margin-left: auto;
`
const MarginRight8 = styled.div`
    margin-right: ${Spacing.margin._8}px;
`
interface TaskDetailsProps {
    task: TTask
}
const TaskDetails = (props: TaskDetailsProps) => {
    const { mutate: modifyTask, isError, isLoading } = useModifyTask()

    const [task, setTask] = useState<TTask>(props.task)
    const [titleInput, setTitleInput] = useState('')
    const [bodyInput, setBodyInput] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [labelEditorShown, setLabelEditorShown] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)

    const titleRef = useRef<HTMLTextAreaElement>(null)
    const bodyRef = useRef<HTMLTextAreaElement>(null)
    const timers = useRef<{ [key: string]: { timeout: NodeJS.Timeout; callback: () => void } }>({})

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
        setTask(props.task)
        setTitleInput(props.task.title)
        setBodyInput(props.task.body)
    }, [props.task])

    useLayoutEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = '0px'
            titleRef.current.style.height =
                titleRef.current.scrollHeight > 300 ? '300px' : `${titleRef.current.scrollHeight}px`
        }
    }, [titleInput])

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

    // Temporary hack to check source of linked task. All tasks currently have a hardcoded sourceID to GT (see PR #1104)
    const icon = task.linked_email_thread ? logos.gmail : logos[task.source.logo_v2]

    return (
        <DetailsViewContainer data-testid="details-view-container">
            <DetailsTopContainer>
                <MarginRight8>
                    <Icon source={icon} size="small" />
                </MarginRight8>
                <SubtitleSmall>{syncIndicatorText}</SubtitleSmall>
                <MarginLeftAuto>
                    {task.deeplink && (
                        <a href={task.deeplink} target="_blank" rel="noreferrer">
                            <RoundedGeneralButton textStyle="dark" value={`View in ${task.source.name}`} />
                        </a>
                    )}
                    <ActionOption
                        isShown={labelEditorShown}
                        setIsShown={setLabelEditorShown}
                        task={task}
                        keyboardShortcut={KEYBOARD_SHORTCUTS.SHOW_LABEL_EDITOR}
                    />
                </MarginLeftAuto>
            </DetailsTopContainer>
            <TitleInput
                ref={titleRef}
                data-testid="task-title-input"
                onKeyDown={handleKeyDown}
                value={titleInput}
                onChange={(e) => {
                    setTitleInput(e.target.value)
                    onEdit(task.id, titleRef.current?.value || '', bodyRef.current?.value || '')
                }}
            />
            <BodyContainer>
                <BodyTextArea
                    ref={bodyRef}
                    data-testid="task-body-input"
                    placeholder="Add task details"
                    value={bodyInput}
                    onChange={(e) => {
                        setBodyInput(e.target.value)
                        onEdit(task.id, titleRef.current?.value || '', bodyRef.current?.value || '')
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                />
            </BodyContainer>
        </DetailsViewContainer>
    )
}

export default TaskDetails
