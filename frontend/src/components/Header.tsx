import React from 'react'
import { Link } from 'react-router-dom'
import { LANDING_PATH, SETTINGS_PATH } from '../constants'
import { getAuthToken, logout } from '../helpers/utils'
import styled from 'styled-components'

const Logo = styled.div`
  font-weight: bold;
  font-size: 32px;
  margin-left: 20px;
  margin-top: 10px;
  padding: 20px;
`
const HeaderDiv = styled.div` 
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`
const Button = styled.button`
  margin: 0 12px 0 12px;
  border: none;
  text-decoration: none;
  padding: 6px;
  text-align: center;
  cursor: pointer;
  font-size: 20px;
  background-color: white;
`
const Logout = styled(Button)`
  font-weight: 600;
  margin-right: 14px;
`

const Header: React.FC = () => {
  return (
    <HeaderDiv>
      <div>
        <Logo>General Task</Logo>
      </div>
      <div>
        <Link to={LANDING_PATH}><Button>Tasks</Button></Link>
        <Link to={SETTINGS_PATH}><Button>Settings</Button></Link>
        <Logout onClick={logout} disabled={!getAuthToken()}>Logout</Logout>
      </div>
    </HeaderDiv>
  )
}

export default Header
