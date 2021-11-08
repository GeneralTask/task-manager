import { BACKGROUND_HOVER, DIVIDER_LIGHTGRAY, TEXT_GRAY } from '../../helpers/styles'
import { DeviceSize, useDeviceSize } from '../../helpers/utils'
import React, { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useDrop } from 'react-dnd'
import { ItemTypes } from '../../helpers/types'
import store from '../../redux/store'
import { sectionDrop } from '../../redux/actions'

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
const InsideHeader = styled.div<{isOver: boolean}>`
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
  show_current_time: boolean,
  name: string,
  task_section_index: number,
}

export default function TaskSectionHeader(props: Props): JSX.Element {
  const [{isOver}, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    collect: monitor => ({
      isOver: !!monitor.isOver()
    }),
    drop: ({id}: {id: string}) => {
      store.dispatch(sectionDrop(id, props.task_section_index))
    }
  }))
  return (
    <TaskSectionHeaderContainer>
      <TimeAnnotation>{props.show_current_time && <CurrentTime />}</TimeAnnotation>
      <InsideHeader isOver={isOver} ref={drop} >
        <Spanbar />
        <HeaderText>{props.name}</HeaderText>
        <Spanbar />
      </InsideHeader>
      <TimeAnnotation></TimeAnnotation>
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
