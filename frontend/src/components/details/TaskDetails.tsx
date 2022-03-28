import React, { createRef, useEffect, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import { useModifyTask } from '../../services/api-query-hooks'
import { logos } from '../../styles/images'
import { TTask } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import TaskHTMLBody from '../atoms/TaskHTMLBody'
import TooltipWrapper from '../atoms/TooltipWrapper'
import ActionOption from '../molecules/ActionOption'
import DetailsTemplate, { BodyTextArea, FlexGrowView, TitleInput } from './DetailsTemplate'

interface TaskDetailsProps {
    task: TTask
}
const TaskDetails = (props: TaskDetailsProps) => {
    const { mutate: modifyTask } = useModifyTask()

    const [task, setTask] = useState<TTask>(props.task)
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
        else e.stopPropagation()
    }

    const handleBlur = () => {
        modifyTask({ id: task.id, title: titleInput, body: bodyInput })
    }

    return (
        <DetailsTemplate
            top={
                <>
                    <Icon source={logos[task.source.logo_v2]} size="small" />
                    <FlexGrowView />
                    <TooltipWrapper inline dataTip="Due Date" tooltipId="tooltip">
                        <ActionOption
                            isShown={datePickerShown}
                            setIsShown={setDatePickerShown}
                            action="date_picker"
                            task={task} />
                    </TooltipWrapper>
                    <TooltipWrapper inline dataTip="Time Estimate" tooltipId="tooltip">
                        <ActionOption
                            isShown={timeEstimateShown}
                            setIsShown={setTimeEstimateShown}
                            action="time_allocated"
                            task={task} />
                    </TooltipWrapper>
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
            body={
                task.source.name === 'Asana' || task.source.name === 'Gmail' ? (
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
