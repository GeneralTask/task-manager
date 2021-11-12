import { BACKGROUND_HOVER, DIVIDER_LIGHTGRAY, TEXT_GRAY } from '../../helpers/styles'
import { DeviceSize, sectionDropReorder, useDeviceSize } from '../../helpers/utils'
import React, { useEffect, useRef, useState } from 'react'

import { DateTime } from 'luxon'
import { ItemTypes, TTaskSection } from '../../helpers/types'
import RefreshButton from './RefreshButton'
import store, { RootState } from '../../redux/store'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { useDrop } from 'react-dnd'
import { setTasks } from '../../redux/actions'

const TaskSectionHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  color: ${TEXT_GRAY};
`
const Spanbar = styled.div`
  display: flex;
  background-color: ${DIVIDER_LIGHTGRAY};
  height: 1px;
  flex: 1;
  border-left: 1px solid ${DIVIDER_LIGHTGRAY};
  border-right: 1px solid ${DIVIDER_LIGHTGRAY};
  border-radius: 2px;
`
const TimeAnnotation = styled.div`
  display: flex;
  width: 15%;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
`
const TimeAnnotationRight = styled(TimeAnnotation)`
  justify-content: flex-start;
`
const InsideHeader = styled.div<{ isOver: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60%;
  margin-left: 4px;
  background-color: ${props => props.isOver ? BACKGROUND_HOVER : 'inherit'};
  border-radius: 2px;
  height:100%;
`
const HeaderText = styled.div`
  font-size: 28px;
  margin: 0 40px;
`
const CurrentTimeText = styled.div`
  font-size: 18px;
  font-weight: 600;
  padding-right: 10px;
`

interface Props {
  isToday: boolean,
  name: string,
  task_section_index: number,
}

export default function TaskSectionHeader(props: Props): JSX.Element {
  const taskSections = useSelector((state: RootState) => state.task_sections)
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
