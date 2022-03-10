import React, { createRef, useEffect, useRef, useState } from 'react'
import styled from 'styled-components/native'
import webStyled from 'styled-components'
import { useGetTasksQuery, useModifyTaskMutation } from '../../services/generalTaskApi'
import { useParams } from '../../services/routing'
import { Colors, Spacing, Typography } from '../../styles'
import { Icon } from '../atoms/Icon'
import { logos } from '../../styles/images'

const DetailsViewContainer = styled.View`
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
    width: 400px;
    margin-top: ${Spacing.margin.large}px;
`
const TaskTitleContainer = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
`
const TitleInput = webStyled.input`
    background-color: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize}px;
    font-weight: ${Typography.weight._600.fontWeight};
    border: none;
    display: inline-block;
    margin-left: ${Spacing.margin.small}px;
    :focus {
        outline: 1px solid ${Colors.gray._500};
    }
`
const BodyTextArea = webStyled.textarea`
    display: block;
    background-color: inherit;
    margin-top: ${Spacing.margin.medium}px;
    flex: 1;
    border: none;
    resize: none;
    outline: none;
    overflow: auto;
    padding-right: ${Spacing.margin.small}px;
    font: inherit;
    font-color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize}px;
`

const DetailsView = () => {
    const params = useParams()
    const { data: taskSections, isLoading } = useGetTasksQuery()
    const [modifyTask] = useModifyTaskMutation()
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const contentEditableBodyRef = createRef<HTMLElement>()
    const inputRef = createRef<HTMLInputElement>()
    const bodyHTMLRef = useRef<string>('')

    const section = taskSections ? taskSections.find(section => section.id === params.section) : undefined
    const task = section ? section.tasks.find(task => task.id === params.task) : undefined

    useEffect(() => {
        if (!task) return
        setTitle(task.title)
        setBody(task.body)
        if (contentEditableBodyRef.current) {
            contentEditableBodyRef.current.innerText = `${task.body}`
            bodyHTMLRef.current = `${task.body}`
        }
    }, [task])

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (inputRef.current && (e.key === 'Enter' || e.key === 'Escape')) inputRef.current.blur()
    }

    const handleBlur = () => {
        if (!task) return
        modifyTask({ id: task.id, title: title, body: body })
    }

    return (
        task == null || isLoading ? (null) : (
            <DetailsViewContainer>
                <TaskTitleContainer>
                    <Icon source={logos[task.source.logo_v2]} size="small" />
                    <TitleInput ref={inputRef} type="text" onKeyDown={handleKeyDown} value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleBlur} />
                </TaskTitleContainer>
                <BodyTextArea placeholder='Add task details' value={body} onChange={(e) => setBody(e.target.value)} onBlur={handleBlur} />
            </DetailsViewContainer>
        )
    )
}

export default DetailsView
