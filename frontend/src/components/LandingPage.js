import Cookies from 'js-cookie'

import TaskList from './task/TaskList'
import GLButton from './login/GoogleLogin'
import { LOGIN_URL } from '../constants'


function LandingPage() {
    if (Cookies.get('authToken')) {
      return <TaskList />
    }
    return (
      <div id="home">
        <h1>General Task</h1>
        <h2>Welcome to the landing page!</h2>
        <a href={LOGIN_URL}><GLButton/></a>
      </div>
    )
}

export default LandingPage;
