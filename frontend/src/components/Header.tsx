import { DeviceSize, getAuthToken, logout, useDeviceSize } from '../helpers/utils'
import { LANDING_PATH, SETTINGS_PATH } from '../constants'
import React, { useEffect } from 'react'
import { TEXT_BLACK, TEXT_BLACK_HOVER } from '../helpers/styles'

import { Link } from 'react-router-dom'
import styled from 'styled-components'

const Logo = styled.button`
  border: none;
  text-decoration: none;
  cursor: pointer;
  color: ${TEXT_BLACK};
  font-weight: bold;
  font-size: 32px;
  margin: 16px 0 0 20px;
  background-color: white;
  &:hover {color: ${TEXT_BLACK_HOVER}};
`
const HeaderDiv = styled.div` 
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`
const Button = styled.button`
  margin: 0 12px 0 12px;
  border: none;
  text-decoration: none;
  color: ${TEXT_BLACK};
  padding: 6px;
  text-align: center;
  cursor: pointer;
  font-size: 20px;
  background-color: white;
  &:hover {color: ${TEXT_BLACK_HOVER}};
`
const Logout = styled(Button)`
  color: ${TEXT_BLACK};
  /* font-weight: 600; */
  margin-right: 20px;
  text-align: left;
  &:hover {color: ${TEXT_BLACK_HOVER}};
`
const Hamburger = styled.img`
  cursor: pointer;
  width: 32px;
  margin-right: 20px;
`
const DropDown = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 40px;
`

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const deviceSize = useDeviceSize()

  useEffect(() => {
    if (deviceSize !== DeviceSize.MOBILE) {
      setIsMenuOpen(false)
    }
  }, [deviceSize])

  return (
    <>
      <HeaderDiv>
        <div>
          <Link to={LANDING_PATH}><Logo>General Task</Logo></Link>
        </div>
        <div>
          {deviceSize === DeviceSize.MOBILE
            ? <Hamburger src="images/hamburger.svg" onClick={toggleMenu} />
            : <>
              <Link to={LANDING_PATH}><Button>Tasks</Button></Link>
              <Link to={SETTINGS_PATH}><Button>Settings</Button></Link>
              <Logout onClick={logout} disabled={!getAuthToken()}>Logout</Logout>
            </>}
        </div>
      </HeaderDiv>
      {deviceSize === DeviceSize.MOBILE && isMenuOpen && <DropDown>
        <Link to={LANDING_PATH}><Button>Tasks</Button></Link>
        <Link to={SETTINGS_PATH}><Button>Settings</Button></Link>
        <Logout onClick={logout} disabled={!getAuthToken()}>Logout</Logout>
      </DropDown>}
    </>
  )
}

export default React.memo(Header)
