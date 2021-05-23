import React from 'react'
import styled from 'styled-components'

const AccountDiv = styled.div`
  margin: auto;
  width: 90%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24px;
  margin-bottom: 30px;
`
const AccountLogo = styled.img`
  height: 35px;
`
const ConnectButton = styled.button`
  font-size: 20px;
  padding: 4px 8px 4px;
  background-color: black;
  border-radius: 4px;
  color: white;
  cursor: pointer;
`

interface Props {
  name: string,
  logo: string,
  link: string,
}

const Account: React.FC<Props> = ({ name, logo, link }: Props) => (
  <AccountDiv>
    <AccountLogo src={logo} alt={name + ' logo'} />
    <div>{name}</div>
    <ConnectButton
      onClick={() => {
        window.open(
          link,
          name,
          'height=640,width=960,toolbar=no,menubar=no,scrollbars=no,location=no,status=no'
        )
      }}
    >
      Connect
    </ConnectButton>
  </AccountDiv>
)

export default Account
