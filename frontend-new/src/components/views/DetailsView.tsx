import React, { createRef, useEffect, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import webStyled from 'styled-components'
import styled from 'styled-components/native'
import { useModifyTaskMutation } from '../../services/generalTaskApi'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TTask } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import TaskHTMLBody from '../atoms/TaskHTMLBody'
import TooltipWrapper from '../atoms/TooltipWrapper'
import ActionOption from '../molecules/ActionOption'

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
    z-index: 1;
    height: 50px;
`
const TitleInput = webStyled.input`
    background-color: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize}px;
    font-weight: ${Typography.weight._600.fontWeight};
    border: none;
    display: inline-block;
    margin-left: ${Spacing.margin.small}px;
    flex: 1;
    :focus {
        outline: 1px solid ${Colors.gray._500};
    }
`
const BodyTextArea = webStyled.textarea`
    display: block;
    background-color: inherit;
    border: none;
    resize: none;
    outline: none;
    overflow: auto;
    padding-right: ${Spacing.margin.small}px;
    font: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize}px;
    height: 250px;
`
const MarginTopContainer = styled.View`
    margin-top: ${Spacing.margin.medium}px;
    flex: 1;
    overflow: auto;
`
const FlexGrowView = styled.View`
    flex: 1;
`

interface DetailsViewProps {
    task: TTask
}
const DetailsView = ({ task }: DetailsViewProps) => {
    const [modifyTask] = useModifyTaskMutation()
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [sourceName, setSourceName] = useState('')
    const [datePickerShown, setDatePickerShown] = useState(false)
    const [timeEstimateShown, setTimeEstimateShown] = useState(false)
    const inputRef = createRef<HTMLInputElement>()

    useEffect(() => {
        ReactTooltip.rebuild()
    }, [])
    useEffect(() => {
        if (datePickerShown) setTimeEstimateShown(false)
    }, [datePickerShown])
    useEffect(() => {
        if (timeEstimateShown) setDatePickerShown(false)
    }, [timeEstimateShown])

    useEffect(() => {
        setTitle(task.title)
        setBody(task.body)
        setSourceName(task.source.name)
    }, [task])

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (inputRef.current && (e.key === 'Enter' || e.key === 'Escape')) inputRef.current.blur()
        else e.stopPropagation()
    }

    const handleBlur = () => {
        if (!task) return
        modifyTask({ id: task.id, title: title, body: body })
    }

    return (
        <DetailsViewContainer>
            <TaskTitleContainer>
                <Icon source={logos[task.source.logo_v2]} size="small" />
                <FlexGrowView>
                    <TitleInput
                        ref={inputRef}
                        type="text"
                        onKeyDown={handleKeyDown}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleBlur}
                    />
                </FlexGrowView>
                <TooltipWrapper inline dataTip="Due Date" tooltipId="tooltip">
                    <ActionOption
                        isShown={datePickerShown}
                        setIsShown={setDatePickerShown}
                        action="date_picker"
                        task={task}
                    />
                </TooltipWrapper>
                <TooltipWrapper inline dataTip="Time Estimate" tooltipId="tooltip">
                    <ActionOption
                        isShown={timeEstimateShown}
                        setIsShown={setTimeEstimateShown}
                        action="time_allocated"
                        task={task}
                    />
                </TooltipWrapper>
            </TaskTitleContainer>
            <MarginTopContainer>
                {sourceName === 'Asana' ? (
                    <TaskHTMLBody html={body} />
                ) : (
                    <BodyTextArea
                        placeholder="Add task details"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onBlur={handleBlur}
                    />
                )}
            </MarginTopContainer>
        </DetailsViewContainer>
    )
}

export default DetailsView
