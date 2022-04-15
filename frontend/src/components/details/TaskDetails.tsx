import DetailsTemplate, { BodyTextArea, FlexGrowView, TitleInput } from './DetailsTemplate'
import React, { createRef, useEffect, useState } from 'react'

import ActionOption from '../molecules/ActionOption'
import EmailSenderDetails from '../molecules/EmailSenderDetails'
import { Icon } from '../atoms/Icon'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import ReactTooltip from 'react-tooltip'
import { TTask } from '../../utils/types'
import TaskHTMLBody from '../atoms/TaskHTMLBody'
import { logos } from '../../styles/images'
import { useModifyTask } from '../../services/api-query-hooks'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import styled from 'styled-components'
import { Spacing } from '../../styles'

interface TaskDetailsProps {
    task: TTask
}
const TaskDetails = (props: TaskDetailsProps) => {
    const { mutate: modifyTask } = useModifyTask()

    const [task, setTask] = useState<TTask>(props.task)
    const [titleInput, setTitleInput] = useState('')
    const [bodyInput, setBodyInput] = useState('')

    const [labelEditorShown, setLabelEditorShown] = useState(false)
    const titleRef = createRef<HTMLTextAreaElement>()

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

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (titleRef.current && (e.key === 'Enter' || e.key === 'Escape')) titleRef.current.blur()
        e.stopPropagation()
    }

    const handleBlur = () => {
        modifyTask({ id: task.id, title: titleInput, body: bodyInput })
    }

    const MarginRightContainer = styled.div`
        margin-right: ${Spacing.margin._16}px;
    `

    return (
        <DetailsTemplate
            top={
                <>
                    <Icon source={logos[task.source.logo_v2]} size="small" />
                    <FlexGrowView />
                    <MarginRightContainer>
                        {task.deeplink && (
                            <a href={task.deeplink} target="_blank" rel="noreferrer">
                                <RoundedGeneralButton textStyle="dark" value={`View in ${task.source.name}`} />
                            </a>
                        )}
                    </MarginRightContainer>
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
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleBlur}
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
                        onBlur={handleBlur}
                    />
                )
            }
        />
    )
}

export default TaskDetails
