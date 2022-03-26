import { Colors, Spacing, Typography } from '../../styles'
import React, { createRef, useEffect, useState } from 'react'

import ActionOption from '../molecules/ActionOption'
import { Icon } from '../atoms/Icon'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import ReactTooltip from 'react-tooltip'
import { TTask } from '../../utils/types'
import TaskHTMLBody from '../atoms/TaskHTMLBody'
import TooltipWrapper from '../atoms/TooltipWrapper'
import { logos } from '../../styles/images'
import styled from 'styled-components/native'
import { useModifyTask } from '../../services/api-query-hooks'
import webStyled from 'styled-components'

const DetailsViewContainer = styled.View`
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
    width: 400px;
    margin-top: ${Spacing.margin.large}px;
    padding: ${Spacing.padding.medium}px;
`
const TaskTitleButtonsContainer = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
    z-index: 1;
    height: 50px;
`
const TaskTitleContainer = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
`
const TitleInput = webStyled.textarea`
    background-color: inherit;
    color: ${Colors.gray._600};
    font: inherit;
    font-size: ${Typography.xSmall.fontSize}px;
    font-weight: ${Typography.weight._600.fontWeight};
    border: none;
    resize: none;
    outline: none;
    overflow: hidden;
    display: flex;
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
    const { mutate: modifyTask } = useModifyTask()
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [sourceName, setSourceName] = useState('')
    const [datePickerShown, setDatePickerShown] = useState(false)
    const [timeEstimateShown, setTimeEstimateShown] = useState(false)
    const titleRef = createRef<HTMLTextAreaElement>()

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

        if (titleRef.current) {
            titleRef.current.value = task.title
            titleRef.current.style.height = '0px'
            titleRef.current.style.height =
                titleRef.current.scrollHeight > 300 ? '300px' : `${titleRef.current.scrollHeight}px`
        }
    }, [task])

    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = '0px'
            titleRef.current.style.height =
                titleRef.current.scrollHeight > 300 ? '300px' : `${titleRef.current.scrollHeight}px`
        }
    }, [title])

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (titleRef.current && (e.key === 'Enter' || e.key === 'Escape')) titleRef.current.blur()
        else e.stopPropagation()
    }

    const handleBlur = () => {
        if (!task) return
        modifyTask({ id: task.id, title: title, body: body })
    }

    return (
        <DetailsViewContainer>
            <TaskTitleButtonsContainer>
                <Icon source={logos[task.source.logo_v2]} size="small" />
                <FlexGrowView />
                <TooltipWrapper inline dataTip="Due Date" tooltipId="tooltip">
                    <ActionOption
                        isShown={datePickerShown}
                        setIsShown={setDatePickerShown}
                        action="date_picker"
                        task={task}
                        keyboardShortcut={KEYBOARD_SHORTCUTS.SHOW_DATE_PICKER}
                    />
                </TooltipWrapper>
                <TooltipWrapper inline dataTip="Time Estimate" tooltipId="tooltip">
                    <ActionOption
                        isShown={timeEstimateShown}
                        setIsShown={setTimeEstimateShown}
                        action="time_allocated"
                        task={task}
                        keyboardShortcut={KEYBOARD_SHORTCUTS.SHOW_TIME_ESTIMATION_PICKER}
                    />
                </TooltipWrapper>
            </TaskTitleButtonsContainer>
            <TaskTitleContainer>
                <TitleInput
                    ref={titleRef}
                    onKeyDown={handleKeyDown}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleBlur}
                />
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
