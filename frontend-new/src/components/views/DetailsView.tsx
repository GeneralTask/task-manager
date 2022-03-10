import React, { createRef, useEffect, useState } from 'react'
import webStyled from 'styled-components'
import styled from 'styled-components/native'
import { useGetTasksQuery, useModifyTaskMutation } from '../../services/generalTaskApi'
import { useParams } from '../../services/routing'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import DatePicker from '../molecules/DatePicker'
import TimeEstimatePicker from '../molecules/TimeEstimatePicker'

const DetailsViewContainer = styled.View`
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
    width: 400px;
    margin-top: ${Spacing.margin.large}px;
    padding: ${Spacing.padding.medium}px;
`
const TaskTitleContainer = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
`
const ActionButton = styled.Pressable`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border-radius: 8px;
    background-color: ${Colors.gray._100};
    margin-right: ${Spacing.margin.small}px;
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
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize}px;
`

const DetailsView = () => {
    const params = useParams()
    const { data: taskSections, isLoading } = useGetTasksQuery()
    const [modifyTask] = useModifyTaskMutation()
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [datePickerShown, setDatePickerShown] = useState(false)
    const [timeEstimateShown, setTimeEstimateShown] = useState(false)
    const inputRef = createRef<HTMLInputElement>()

    useEffect(() => {
        if (datePickerShown) setTimeEstimateShown(false)
    }, [datePickerShown])
    useEffect(() => {
        if (timeEstimateShown) setDatePickerShown(false)
    }, [timeEstimateShown])

    const section = taskSections?.find(section => section.id === params.section)
    const task = section?.tasks.find(task => task.id === params.task)

    useEffect(() => {
        if (!task) return
        setTitle(task.title)
        setBody(task.body)
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
                    <ActionButton onPress={() => setDatePickerShown(!datePickerShown)}>
                        <Icon source={icons['calendar_blank']} size="small" />
                        {datePickerShown && <DatePicker task_id={task.id} due_date={task.due_date} closeDatePicker={() => setDatePickerShown(false)} />}
                    </ActionButton>
                    <ActionButton onPress={() => setTimeEstimateShown(!timeEstimateShown)}>
                        <Icon source={icons['timer']} size="small" />
                        {timeEstimateShown && <TimeEstimatePicker task_id={task.id} closeTimeEstimate={() => setTimeEstimateShown(false)} />}
                    </ActionButton>
                </TaskTitleContainer>
                <BodyTextArea placeholder='Add task details' value={body} onChange={(e) => setBody(e.target.value)} onBlur={handleBlur} />
            </DetailsViewContainer>
        )
    )
}

export default DetailsView
