import { DateTime } from 'luxon'
import React, { createRef, useEffect, useRef, useState } from 'react'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import webStyled from 'styled-components'
import styled from 'styled-components/native'
import { useGetTasksQuery, useModifyTaskMutation } from '../../services/generalTaskApi'
import { useParams } from '../../services/routing'
import { Colors, Spacing, Typography } from '../../styles'

const DetailsViewContainer = styled.ScrollView`
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
    width: 400px;
    margin-top: ${Spacing.margin.large};
`
const Input = webStyled.input`
    background-color: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize};
    font-weight: ${Typography.weight._600.fontWeight};
    border: none;
    :focus {
        outline: 1px solid ${Colors.gray._500};
    }
    margin-top: 10px;
`

const DetailsView = () => {
    const params = useParams()
    const { data: taskSections, isLoading } = useGetTasksQuery()
    const [modifyTask] = useModifyTaskMutation()
    const [title, setTitle] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [timeAllocated, setTimeAllocated] = useState('')
    const contentEditableBodyRef = createRef<HTMLElement>()
    const bodyHTMLRef = useRef<string>('')

    const section = taskSections ? taskSections.find(section => section.id === params.section) : undefined
    const task = section ? section.tasks.find(task => task.id === params.task) : undefined

    useEffect(() => {
        if (!task) return
        setTitle(task.title)
        setDueDate(DateTime.fromISO(task.due_date).toISODate() || '')
        setTimeAllocated(task.time_allocated.toString())
        if (contentEditableBodyRef.current) {
            contentEditableBodyRef.current.innerText = `${task.body}`
            bodyHTMLRef.current = `${task.body}`
        }
    }, [task])

    const handleBodyChange = (e: ContentEditableEvent) => {
        bodyHTMLRef.current = e.target.value
    }
    const handleBlur = () => {
        if (task && contentEditableBodyRef.current != null) {
            modifyTask({ id: task.id, title: title, body: contentEditableBodyRef.current.innerText, due_date: DateTime.fromISO(dueDate).toISO(), time_duration: parseInt(timeAllocated) })
        }
    }

    return (
        task == null || isLoading ? (null) : (
            <DetailsViewContainer>
                <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleBlur} />
                <ContentEditable
                    innerRef={contentEditableBodyRef}
                    html={bodyHTMLRef.current}
                    disabled={false}
                    onChange={handleBodyChange}
                    onBlur={handleBlur}
                    tagName='div'
                />
                <Input type="text" value={dueDate} onChange={(e) => setDueDate(e.target.value)} onBlur={handleBlur} />
                <Input type="text" value={timeAllocated} onChange={(e) => setTimeAllocated(e.target.value)} onBlur={handleBlur} />
            </DetailsViewContainer>
        )
    )
}

export default DetailsView
