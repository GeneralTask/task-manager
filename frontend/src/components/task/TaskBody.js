import store from '../../redux/store'
import { connect, useSelector } from 'react-redux'

const TaskBody = (body) => {
    return <div>This is the body</div>
}

export default connect(
    state => ({expanded_body: state.expanded_body})
)(TaskBody);
