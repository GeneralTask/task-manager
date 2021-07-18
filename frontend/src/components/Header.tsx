import React from 'react'
import { Link } from 'react-router-dom'
import { LANDING_PATH, SETTINGS_PATH } from '../constants'
import { getAuthToken, logout } from '../helpers/utils'
import { textBlack, textHover } from '../helpers/styles'
import styled from 'styled-components'

const Logo = styled.button`
  border: none;
  text-decoration: none;
  cursor: pointer;
  color: ${textBlack};
  font-weight: bold;
  font-size: 32px;
  margin-left: 20px;
  margin-top: 10px;
  padding: 20px;
  background-color: white;
  &:hover {color: ${textHover}};
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
  color: ${textBlack};
  padding: 6px;
  text-align: center;
  cursor: pointer;
  font-size: 20px;
  background-color: white;
  &:hover {color: ${textHover}};
`
const Logout = styled(Button)`
  color: ${textBlack};
  font-weight: 600;
  margin-right: 50px;
  &:hover {color: ${textHover}};
`

const Header: React.FC = () => {
  return (
    <HeaderDiv>
      <div>
        <Link to={LANDING_PATH}><Logo>General Task</Logo></Link>
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
