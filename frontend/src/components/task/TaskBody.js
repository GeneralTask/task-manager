import { connect, useSelector } from 'react-redux'
import styled from 'styled-components'

const BodyHTML = styled.iframe`
    border: none;
    border-radius: 2px;
    width: 100%
`;
const BodyDiv = styled.div`
    margin: auto;
    width: 95%;
    padding: 6px;
`;

// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody = ({body, task_id}) => {
    const expanded_body = useSelector(state => state.expanded_body);
    return <BodyDiv>
        {body && expanded_body === task_id 
        ? <BodyHTML title={"Body for task: " + task_id} srcDoc={body}></BodyHTML>
        : null }
    </BodyDiv>
}

export default connect(
    state => ({expanded_body: state.expanded_body})
)(TaskBody);
