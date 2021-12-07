import './Task.css'

import { TaskContainer, DraggableContainer, DropIndicatorAbove, DropIndicatorBelow } from './Task-style'
import { Indices, ItemTypes } from '../../helpers/types'

import React from 'react'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './TaskHeader'
import { useAppSelector } from '../../redux/hooks'
import { useDrag } from 'react-dnd'

interface Props {
  task: TTask,
  dragDisabled: boolean,
  datetimeStart: string | null, // null if unscheduled_task
  isOver: boolean,
  dropDirection: boolean,
  indices: Indices,
  emailSender?: string | null,
  emailSentTime?: string | null,
}

export default function Task(props: Props): JSX.Element {
  const { task, datetimeStart, dragDisabled, isOver, dropDirection } = props
  const { isBodyExpanded } = useAppSelector(state => ({
    isBodyExpanded: state.tasks_page.expanded_body === task.id,
  }))
  const indicesRef = React.useRef<Indices>()
  indicesRef.current = props.indices

  const [{ opacity }, drag, dragPreview] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id, indicesRef: indicesRef },
    collect: monitor => {
      const isDragging = !!monitor.isDragging()
      return { opacity: isDragging ? 0.5 : 1 }
    }
  }))

  return (
    <DraggableContainer ref={dragPreview}>
      <DropIndicatorAbove isVisible={isOver && dropDirection} />
      <TaskContainer opacity={opacity} isExpanded={isBodyExpanded}>
        <TaskHeader
          task={task}
          datetimeStart={datetimeStart}
          dragDisabled={dragDisabled}
          isExpanded={isBodyExpanded}
          ref={drag}
        />
        <TaskBody
          body={task.body}
          task_id={task.id}
          deeplink={task.deeplink}
          source={task.source}
          isExpanded={isBodyExpanded}
          sender={task.sender}
          emailSender={task.emailSender}
          emailSentTime={task.emailSentTime}
        />
      </TaskContainer>
      <DropIndicatorBelow isVisible={isOver && !dropDirection} />
    </DraggableContainer>
  )

  // return (
  //   <DraggableContainer ref={dragPreview}>
  //     <DropIndicatorAbove isVisible={isOver && dropDirection} />
  //     <Container opacity={opacity} >
  //       <TaskHeader
  //         task={task}
  //         datetimeStart={datetimeStart}
  //         dragDisabled={dragDisabled}
  //         isExpanded={isBodyExpanded}
  //         ref={drag}
  //       />
  //       <TaskBody
  //         body={task.body}
  //         task_id={task.id}
  //         deeplink={task.deeplink}
  //         source={task.source}
  //         isExpanded={isBodyExpanded}
  //         sender={task.sender}
  //         emailSender={task.emailSender}
  //         emailSentTime={task.emailSentTime}
  //       />
  //     </Container>
  //     <DropIndicatorBelow isVisible={isOver && !dropDirection} />
  //   </DraggableContainer>
  // )
}
