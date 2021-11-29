import * as styles from './TaskSectionHeader-style'

import { DeviceSize, fetchTasks, lookupTaskObject, lookupTaskSection, makeAuthorizedRequest, sectionDropReorder, useDeviceSize } from '../../helpers/utils'
import { ItemTypes, TTaskSection } from '../../helpers/types'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import store, { RootState } from '../../redux/store'

import { DateTime } from 'luxon'
import RefreshButton from './RefreshButton'
import { TASKS_MODIFY_URL } from '../../constants'
import { setTasks } from '../../redux/actions'
import { useDrop } from 'react-dnd'
import { useSelector } from 'react-redux'

interface Props {
  isToday: boolean,
  name: string,
  task_section_index: number,
}

export default function TaskSectionHeader(props: Props): JSX.Element {
  const taskSections = useSelector((state: RootState) => state.tasks_page.task_sections)
  const taskSectionsRef = useRef<TTaskSection[]>(taskSections)
  taskSectionsRef.current = taskSections

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    collect: monitor => ({
      isOver: !!monitor.isOver()
    }),
    drop: ({ id }: { id: string }) => {
      const updatedTaskSections = sectionDropReorder(taskSectionsRef.current, id, props.task_section_index)
      store.dispatch(setTasks(updatedTaskSections))

      const updatedOrderingId = lookupTaskObject(updatedTaskSections, id)?.id_ordering
      const droppedSectionId = lookupTaskSection(updatedTaskSections, id)
      makeAuthorizedRequest({
        url: TASKS_MODIFY_URL + id + '/',
        method: 'PATCH',
        body: JSON.stringify({
          id_task_section: taskSectionsRef.current[droppedSectionId].id,
          id_ordering: updatedOrderingId
        })
      }).then(fetchTasks).catch((error) => {
        throw new Error('PATCH /tasks/ failed' + error)
      })
    }
  }))
  return (
    <styles.TaskSectionHeaderContainer>
      <styles.TimeAnnotation>{props.isToday && <CurrentTime />}</styles.TimeAnnotation>
      <styles.InsideHeader isOver={isOver} ref={drop} >
        <styles.Spanbar />
        <styles.HeaderText>{props.name}</styles.HeaderText>
        <styles.Spanbar />
      </styles.InsideHeader>
      <styles.TimeAnnotationRight>
        {props.isToday && <RefreshButton />}
      </styles.TimeAnnotationRight>
    </styles.TaskSectionHeaderContainer>
  )
}

function CurrentTime() {
  const [timeStr, setTimeStr] = useState('')
  const deviceSize = useDeviceSize()
  const [isShown, setIsShown] = useState(true)

  const toggleIsShown = useCallback(() => {
    setIsShown(isShown => !isShown)
  }, [])

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
  return <styles.CurrentTimeContainer onClick={toggleIsShown}>
    {deviceSize !== DeviceSize.MOBILE && <styles.CurrentTimeText isShown={isShown}>{timeStr}</styles.CurrentTimeText>}
  </styles.CurrentTimeContainer>
}
