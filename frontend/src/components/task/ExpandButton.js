import styled from 'styled-components'
import {CHEVRON_DOWN} from '../../constants'
import store from '../../redux/store'
import {expandBody, retractBody} from '../../redux/actions'
import { connect, useSelector } from 'react-redux';


const ExpandBody = styled.img`
    margin-left: 10px;
    width: 20px;
`;
const RetractBody = styled(ExpandBody)`
    transform: scaleX(-1); 
`;

// no body: no chevron
// has_body, expanded_body != task_id: chevron down
// has_body, expanded_body == task_id: chevron up
const ExpandButton = ({has_body, task_id}) => {
    console.log("expand", has_body)
    const expanded_body = useSelector(state => state.expanded_body);
    return (
      <div>
        {has_body ? (
          expanded_body !== task_id ? (
            // has a body but is not currently expanded
            <ExpandBody
              src={CHEVRON_DOWN}
              onClick={(e) => {
                e.stopPropagation();
                store.dispatch(expandBody(task_id));
              }}
            />
          ) : (
            // has a body and is currently expanded
            <RetractBody
              src={CHEVRON_DOWN}
              onClick={(e) => {
                e.stopPropagation();
                store.dispatch(retractBody(task_id));
              }}
            />
          )
        // task does not have a body
        ) : (
          null
        )}
      </div>
    );
}

export default connect(
    state => ({expanded_body: state.expanded_body}),
    (state, ownProps) => ({has_body: ownProps.has_body, task_id: ownProps.task_id})
)(ExpandButton);