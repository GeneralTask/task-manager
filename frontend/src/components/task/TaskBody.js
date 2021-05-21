import { connect, useSelector } from 'react-redux'
import styled from 'styled-components'

const BodyHTML = styled.iframe`
    width: 100%;
    border: none;
`;

// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody = ({body, task_id}) => {
    const expanded_body = useSelector(state => state.expanded_body);
    return <div>
        {body && expanded_body === task_id 
        ? <BodyHTML title={"Body for task: " + task_id} srcDoc={body}></BodyHTML>
        : null }
    </div>
}

export default connect(
    state => ({expanded_body: state.expanded_body})
)(TaskBody);
