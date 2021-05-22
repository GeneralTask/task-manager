import React from 'react'
import {Link} from 'react-router-dom'
import { LANDING_PATH, SETTINGS_PATH } from '../constants'
import {getAuthToken} from '../helpers/utils'
import styled from 'styled-components'

const HeaderDiv = styled.div`
  border-bottom: 2px solid #cccccc;
  width: 100%;
  height: 50px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 0 30px;
  & * {
    margin: 0 30px; 
  }
`

const Logout = styled.button`
  background-color: white;
  border: 2px solid #cccccc;
`

const Header = () => {
    return(
        <HeaderDiv>
            <Link to={LANDING_PATH}>Tasks</Link>
            <Link to={SETTINGS_PATH}>Settings</Link>
            <Logout onClick={logout} disabled={!getAuthToken()}>Logout</Logout>
        </HeaderDiv>
    )
}


// This invalidates the cookie on the frontend
// We'll probably want to set up a more robust logout involving the backend
const logout = (e) => {
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.location.href = LANDING_PATH
}

export default Header
