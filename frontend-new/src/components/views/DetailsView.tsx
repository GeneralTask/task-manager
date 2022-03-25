import React, { createRef, useEffect, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import webStyled from 'styled-components'
import styled from 'styled-components/native'
import { useModifyTask } from '../../services/api-query-hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TMessage, TTask } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import TaskHTMLBody from '../atoms/TaskHTMLBody'
import TooltipWrapper from '../atoms/TooltipWrapper'
import ActionOption from '../molecules/ActionOption'

const DetailsViewContainer = styled.View`
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
    width: 640px;
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
const BodyContainer = styled.View`
    margin-top: ${Spacing.margin.medium}px;
    flex: 1;
    overflow: auto;
`
const FlexGrowView = styled.View`
    flex: 1;
`

interface DetailsViewProps {
    item: TTask | TMessage
}
const DetailsView = (props: DetailsViewProps) => {
    const { mutate: modifyTask } = useModifyTask()

    const [item, setItem] = useState<TTask | TMessage>(props.item)
    const [titleInput, setTitleInput] = useState('')
    const [bodyInput, setBodyInput] = useState('')

    const [datePickerShown, setDatePickerShown] = useState(false)
    const [timeEstimateShown, setTimeEstimateShown] = useState(false)
    const titleRef = createRef<HTMLTextAreaElement>()

    useEffect(() => {
        ReactTooltip.rebuild()
    }, [])
    useEffect(() => {
        datePickerShown && setTimeEstimateShown(false)
    }, [datePickerShown])
    useEffect(() => {
        timeEstimateShown && setDatePickerShown(false)
    }, [timeEstimateShown])

    // Update the state of the title, body, and sourceName when the task changes
    useEffect(() => {
        setItem(props.item)
        setTitleInput(props.item.title)
        setBodyInput(props.item.body)

        if (titleRef.current) {
            titleRef.current.value = item.title
            titleRef.current.style.height = '0px'
            titleRef.current.style.height =
                titleRef.current.scrollHeight > 300 ? '300px' : `${titleRef.current.scrollHeight}px`
        }
    }, [props.item])

    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = '0px'
            titleRef.current.style.height =
                titleRef.current.scrollHeight > 300 ? '300px' : `${titleRef.current.scrollHeight}px`
        }
    }, [titleInput])

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (titleRef.current && (e.key === 'Enter' || e.key === 'Escape')) titleRef.current.blur()
        else e.stopPropagation()
    }

    const handleBlur = () => {
        if ((item as TTask).due_date === undefined) return
        modifyTask({ id: item.id, title: titleInput, body: bodyInput })
    }

    return (
        <DetailsViewContainer>
            <TaskTitleButtonsContainer>
                <Icon source={logos[item.source.logo_v2]} size="small" />
                <FlexGrowView />
                {(item as TTask).due_date !== undefined && (
                    <TooltipWrapper inline dataTip="Due Date" tooltipId="tooltip">
                        <ActionOption
                            isShown={datePickerShown}
                            setIsShown={setDatePickerShown}
                            action="date_picker"
                            task={item as TTask}
                        />
                    </TooltipWrapper>
                )}
                {(item as TTask).time_allocated !== undefined && (
                    <TooltipWrapper inline dataTip="Time Estimate" tooltipId="tooltip">
                        <ActionOption
                            isShown={timeEstimateShown}
                            setIsShown={setTimeEstimateShown}
                            action="time_allocated"
                            task={item as TTask}
                        />
                    </TooltipWrapper>
                )}
            </TaskTitleButtonsContainer>
            <TaskTitleContainer>
                <TitleInput
                    ref={titleRef}
                    onKeyDown={handleKeyDown}
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleBlur}
                    disabled={(item as TTask).due_date === undefined}
                />
            </TaskTitleContainer>
            <BodyContainer>
                {item.source.name === 'Asana' || item.source.name === 'Gmail' ? (
                    <TaskHTMLBody html={bodyInput} />
                ) : (
                    <BodyTextArea
                        placeholder="Add task details"
                        value={bodyInput}
                        onChange={(e) => setBodyInput(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onBlur={handleBlur}
                    />
                )}
            </BodyContainer>
        </DetailsViewContainer>
    )
}

export default DetailsView
