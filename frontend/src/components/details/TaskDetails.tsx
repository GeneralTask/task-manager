import DetailsTemplate, { BodyTextArea, FlexGrowView, TitleInput } from './DetailsTemplate'
import React, { createRef, useEffect, useMemo, useState } from 'react'

import ActionOption from '../molecules/ActionOption'
import EmailSenderDetails from '../molecules/EmailSenderDetails'
import { Icon } from '../atoms/Icon'
import { DETAILS_SYNC_TIMEOUT, KEYBOARD_SHORTCUTS } from '../../constants'
import ReactTooltip from 'react-tooltip'
import { TTask } from '../../utils/types'
import TaskHTMLBody from '../atoms/TaskHTMLBody'
import TooltipWrapper from '../atoms/TooltipWrapper'
import { logos } from '../../styles/images'
import { useModifyTask } from '../../services/api-query-hooks'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import styled from 'styled-components'
import { Spacing } from '../../styles'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { useCallback, useRef } from 'react'

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

    const titleRef = createRef<HTMLTextAreaElement>()
    const syncTimer = useRef<NodeJS.Timeout>()

    const syncIndicatorText = useMemo(() => {
        if (isEditing) return 'Editing...'
        if (isLoading) return 'Syncing...'
        if (isError) return 'There was an error syncing with our servers'
        return 'Synced'
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

    const syncDetails = useCallback(() => {
        if (syncTimer.current) clearTimeout(syncTimer.current)
        setIsEditing(false)
        modifyTask({ id: task.id, title: titleInput, body: bodyInput })
    }, [titleInput, bodyInput, task.id, modifyTask])

    const onEdit = useCallback(() => {
        if (syncTimer.current) clearTimeout(syncTimer.current)
        setIsEditing(true)
        syncTimer.current = setTimeout(syncDetails, DETAILS_SYNC_TIMEOUT * 1000)
    }, [syncDetails])

    useEffect(onEdit, [titleInput, bodyInput])

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
                    <TooltipWrapper inline dataTip="Label" tooltipId="tooltip">
                        <ActionOption
                            isShown={labelEditorShown}
                            setIsShown={setLabelEditorShown}
                            task={task}
                            keyboardShortcut={KEYBOARD_SHORTCUTS.SHOW_LABEL_EDITOR}
                        />
                    </TooltipWrapper>
                </>
            }
            title={
                <TitleInput
                    ref={titleRef}
                    onKeyDown={handleKeyDown}
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={syncDetails}
                />
            }
            subtitle={
                task.source.name === 'Gmail' && task.sender && task.recipients ? (
                    <EmailSenderDetails sender={task.sender} recipients={task.recipients} />
                ) : undefined
            }
            body={
                task.source.name === 'Gmail' ? (
                    <TaskHTMLBody dirtyHTML={bodyInput} />
                ) : (
                    <BodyTextArea
                        placeholder="Add task details"
                        value={bodyInput}
                        onChange={(e) => setBodyInput(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onBlur={syncDetails}
                    />
                )
            }
        />
    )
}

export default TaskDetails
