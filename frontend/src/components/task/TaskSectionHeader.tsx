import { CurrentTimeText, HeaderText, InsideHeader, Spanbar, TaskSectionHeaderContainer, TimeAnnotation, TimeAnnotationRight } from './TaskSectionHeader-style'
import { DeviceSize, makeAuthorizedRequest, sectionDropReorder, useDeviceSize, useFetchTasks } from '../../helpers/utils'
import { Indices, ItemTypes, TTaskSection } from '../../helpers/types'
import React, { RefObject, useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import { DateTime } from 'luxon'
import RefreshButton from './RefreshButton'
import { TASKS_MODIFY_URL } from '../../constants'
import { setTasks } from '../../redux/tasksPageSlice'
import { useDrop } from 'react-dnd'

interface Props {
  isToday: boolean,
  name: string,
  task_section_index: number,
}

export default function TaskSectionHeader(props: Props): JSX.Element {
  const taskSections = useAppSelector((state) => state.tasks_page.task_sections)
  const dispatch = useAppDispatch()
  const fetchTasks = useFetchTasks()
  const taskSectionsRef = useRef<TTaskSection[]>(taskSections)
  taskSectionsRef.current = taskSections

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    collect: monitor => ({
      isOver: !!monitor.isOver()
    }),
    drop: ({ id, indicesRef }: { id: string, indicesRef: RefObject<Indices> }) => {
      if (indicesRef.current == null) return
      const updatedTaskSections = sectionDropReorder(taskSectionsRef.current, props.task_section_index, indicesRef.current)
      dispatch(setTasks(updatedTaskSections))

      const patchBody = JSON.stringify({
        id_task_section: taskSectionsRef.current[props.task_section_index].id,
        id_ordering: updatedTaskSections[props.task_section_index]
          .task_groups[0]
          .tasks[0]
          .id_ordering
      })

      makeAuthorizedRequest({
        url: TASKS_MODIFY_URL + id + '/',
        method: 'PATCH',
        body: patchBody,
      }).then(fetchTasks).catch((error) => {
        throw new Error('PATCH /tasks/ failed' + error)
      })
    }
  }))
  return (
    <TaskSectionHeaderContainer>
      <TimeAnnotation>{props.isToday && <CurrentTime />}</TimeAnnotation>
      <InsideHeader isOver={isOver} ref={drop} >
        <Spanbar />
        <HeaderText>{props.name}</HeaderText>
        <Spanbar />
      </InsideHeader>
      <TimeAnnotationRight>
        {props.isToday && <RefreshButton />}
      </TimeAnnotationRight>
    </TaskSectionHeaderContainer>
  )
}

function CurrentTime() {
  const [timeStr, setTimeStr] = useState('')
  const deviceSize = useDeviceSize()

  useEffect(() => {
    if (deviceSize !== DeviceSize.MOBILE) {
      setTimeStr(DateTime.now().toLocaleString(DateTime.TIME_WITH_SECONDS))
      const interval = setInterval(() => {
        setTimeStr(DateTime.now().toLocaleString(DateTime.TIME_WITH_SECONDS))
      }, 1000)

      return () => {
        clearInterval(interval)
      }
    }
    else {
      setTimeStr('')
    }
  }, [deviceSize])
  return <>
    {deviceSize !== DeviceSize.MOBILE && <CurrentTimeText>{timeStr}</CurrentTimeText>}
  </>
}
