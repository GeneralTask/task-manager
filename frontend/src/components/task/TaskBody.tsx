import React from 'react'
import { connect, useSelector } from 'react-redux'
import styled from 'styled-components'
import { RootState } from '../../redux/store'

const BodyHTML = styled.iframe`
  border: none;
  border-radius: 2px;
  width: 100%;
`
const BodyDiv = styled.div`
  margin: auto;
  width: 95%;
  padding: 6px;
`
const Deeplink = styled.div`
  margin: auto;
  text-align: center;
  width: 100%;
  color: black;
`

interface Props {
  body: string | null,
  task_id: string,
  deeplink: string | null,
  source: string,
}


// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody: React.FC<Props> = ({ body, task_id, deeplink, source }: Props) => {
  const expanded_body = useSelector((state: RootState) => state.expanded_body)
  const has_body = body || deeplink
  return (
    <div>
      {has_body && expanded_body === task_id ? (
        <div>
          {body ? (
            <BodyDiv>
              <BodyHTML title={'Body for task: ' + task_id} srcDoc={body} />
            </BodyDiv>
          ) : null}
          {deeplink ? (
            <Deeplink>
              <p>
                See more in <a href={deeplink} target="_blank">{source}</a>
              </p>
            </Deeplink>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default connect((state: RootState) => ({ expanded_body: state.expanded_body }))(
  TaskBody
)
