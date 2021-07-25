import moment from 'moment'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { TEXT_GRAY } from '../../helpers/styles'

const TaskSectionHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  color: ${TEXT_GRAY};
  margin-bottom: 4px;
`
const Spanbar = styled.div`
  display: flex;
  background-color: ${TEXT_GRAY};
  height: 1px;
  flex: 1;
  border-left: 1px solid ${TEXT_GRAY};
  border-right: 1px solid ${TEXT_GRAY};
  border-radius: 2px;
`
const TimeAnnotation = styled.div`
  display: flex;
  width: 15%;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
`
const InsideHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60%;
  margin-left: 4px;
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
}

export default function TaskSectionHeader(props: Props): JSX.Element {
  return (
    <TaskSectionHeaderContainer>
      <TimeAnnotation>{props.show_current_time && <CurrentTime />}</TimeAnnotation>
      <InsideHeader>
        <Spanbar />
        <HeaderText>{props.name}</HeaderText>
        <Spanbar />
      </InsideHeader>
      <TimeAnnotation></TimeAnnotation>
    </TaskSectionHeaderContainer>
  )
}

function CurrentTime() {
  const [timeStr, setTimeStr] = useState(moment().format('h:mm:ss a'))
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStr(moment().format('h:mm:ss a'))
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])
  return <CurrentTimeText>{timeStr}</CurrentTimeText>
}
