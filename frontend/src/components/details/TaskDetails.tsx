import DetailsTemplate, { BodyTextArea, FlexGrowView, TitleInput } from './DetailsTemplate'
import React, { useEffect, useMemo, useState } from 'react'

import ActionOption from '../molecules/ActionOption'
import EmailSenderDetails from '../molecules/EmailSenderDetails'
import { Icon } from '../atoms/Icon'
import { DETAILS_SYNC_TIMEOUT, KEYBOARD_SHORTCUTS } from '../../constants'
import ReactTooltip from 'react-tooltip'
import { TTask } from '../../utils/types'
import SanitizedHTML from '../atoms/SanitizedHTML'
import { logos } from '../../styles/images'
import { useModifyTask } from '../../services/api-query-hooks'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import styled from 'styled-components'
import { Spacing } from '../../styles'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { useCallback, useRef } from 'react'

const SYNC_MESSAGES = {
    SYNCING: 'Syncing...',
    ERROR: 'There was an error syncing with our servers',
    COMPLETE: '',
}

const MarginRight16 = styled.div`
    margin-right: ${Spacing.margin._16}px;
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
    const syncTimer = useRef<NodeJS.Timeout>()

    useEffect(() => {
        if (isEditing || isLoading) {
            setSyncIndicatorText(SYNC_MESSAGES.SYNCING)
        } else if (isError) {
            setSyncIndicatorText(SYNC_MESSAGES.ERROR)
        } else {
            setSyncIndicatorText(SYNC_MESSAGES.COMPLETE)
        }
    }, [isError, isLoading, isEditing])

    useEffect(() => {
        ReactTooltip.rebuild()
    }, [])

    // Update the state when the task changes
    useEffect(() => {
        setTask(props.task)
        setTitleInput(props.task.title)
        setBodyInput(props.task.body)

        if (titleRef.current) {
            titleRef.current.value = task.title
            titleRef.current.style.height = '0px'
            titleRef.current.style.height =
                titleRef.current.scrollHeight > 300 ? '300px' : `${titleRef.current.scrollHeight}px`
        }
    }, [props.task])

    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = '0px'
            titleRef.current.style.height =
                titleRef.current.scrollHeight > 300 ? '300px' : `${titleRef.current.scrollHeight}px`
        }
    }, [titleInput])

    useEffect(() => {
        // to ensure the timeout is cleared on component unmount
        return () => {
            if (syncTimer.current) clearTimeout(syncTimer.current)
        }
    }, [])

    const syncDetails = useCallback(() => {
        if (syncTimer.current) clearTimeout(syncTimer.current)
        setIsEditing(false)
        const title = titleRef?.current ? titleRef.current.value : ''
        const body = bodyRef?.current ? bodyRef.current.value : ''
        modifyTask({ id: task.id, title, body })
    }, [task.id, modifyTask])

    const onEdit = useCallback(() => {
        if (syncTimer.current) clearTimeout(syncTimer.current)
        setIsEditing(true)
        syncTimer.current = setTimeout(syncDetails, DETAILS_SYNC_TIMEOUT * 1000)
    }, [syncDetails])

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (titleRef.current && (e.key === 'Enter' || e.key === 'Escape')) titleRef.current.blur()
        e.stopPropagation()
    }

    return (
        <DetailsTemplate
            top={
                <>
                    <MarginRight8>
                        <Icon source={logos[task.source.logo_v2]} size="small" />
                    </MarginRight8>
                    <SubtitleSmall>{syncIndicatorText}</SubtitleSmall>
                    <FlexGrowView />
                    <MarginRight16>
                        {task.deeplink && (
                            <a href={task.deeplink} target="_blank" rel="noreferrer">
                                <RoundedGeneralButton textStyle="dark" value={`View in ${task.source.name}`} />
                            </a>
                        )}
                    </MarginRight16>
                    <ActionOption
                        isShown={labelEditorShown}
                        setIsShown={setLabelEditorShown}
                        task={task}
                        keyboardShortcut={KEYBOARD_SHORTCUTS.SHOW_LABEL_EDITOR}
                    />
                </>
            }
            title={
                <TitleInput
                    ref={titleRef}
                    onKeyDown={handleKeyDown}
                    value={titleInput}
                    onChange={(e) => {
                        setTitleInput(e.target.value)
                        onEdit()
                    }}
                />
            }
            subtitle={
                task.source.name === 'Gmail' && task.sender && task.recipients ? (
                    <EmailSenderDetails sender={task.sender} recipients={task.recipients} />
                ) : undefined
            }
            body={
                task.source.name === 'Gmail' ? (
                    <SanitizedHTML dirtyHTML={bodyInput} />
                ) : (
                    <BodyTextArea
                        ref={bodyRef}
                        placeholder="Add task details"
                        value={bodyInput}
                        onChange={(e) => {
                            setBodyInput(e.target.value)
                            onEdit()
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                )
            }
        />
    )
}

export default TaskDetails
