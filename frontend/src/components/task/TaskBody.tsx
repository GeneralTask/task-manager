import React, {createRef, useEffect, useState} from 'react'
import ReactDOM from 'react-dom'
import { connect, useSelector } from 'react-redux'
import styled from 'styled-components'
import { RootState } from '../../redux/store'
import { MAX_TASK_BODY_HEIGHT } from '../../constants'

const BodyIframe = styled.iframe<{iframeHeight: number}>`
  border: none;
  border-radius: 2px;
  width: 100%;
  height: ${props => props.iframeHeight + 'px'};
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

interface BodyHTMLProps {
  body: string,
  task_id: string,
}


// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody: React.FC<Props> = ({ body, task_id, deeplink, source }: Props) => {
  const expanded_body = useSelector((state: RootState) => state.expanded_body)
  const has_body = !!(body || deeplink)
  return (
    <div>
      {has_body && expanded_body === task_id ? (
        <div>
          {body ? (
            <BodyDiv>
              <BodyHTML body={body} task_id={task_id} />
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

const BodyHTML: React.FC<BodyHTMLProps> = ({body, task_id}: BodyHTMLProps) => {
  const [iframeHeight, handleIframeHeight] = useState(0)

  const [hasResized, handleHasResized] = useState(false)

  return <BodyIframe 
    id="expanded-body-html"
    iframeHeight={iframeHeight} 
    title={'Body for task: ' + task_id} 
    srcDoc={body} 
    onLoad={() => {
      const iframe: HTMLIFrameElement | null = document.getElementById('expanded-body-html') as HTMLIFrameElement
      if(iframe && iframe.contentWindow){
        iframe.style.height = Math.min(iframe.contentWindow.document.body.offsetHeight + 15, MAX_TASK_BODY_HEIGHT) + 'px'
      }
    }}
    />
}

export default connect((state: RootState) => ({ expanded_body: state.expanded_body }))(
  TaskBody
)
