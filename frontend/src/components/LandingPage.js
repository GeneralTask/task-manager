import { Link } from "react-router-dom";

import TaskList from "./task/TaskList"
import GLButton from "./login/GoogleLogin";
import Cookies from 'js-cookie'

function LandingPage() {
    if (Cookies.get('authToken')) {
      return <TaskList />
    }
    return (
      <div id="home">
        <h1>General Task</h1>
        <h2>Welcome to the landing page!</h2>
        <Link to="/login"><GLButton/></Link>
      </div>
    )
}

export default LandingPage;
