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
const AccountInfo = styled.div`
  display: flex;
  align-items: center;
`
const AccountLogo = styled.img`
  height: 35px;
  margin-right: 30px;
`
const RemoveLinkButton = styled.button`
  width: 140px;
  font-size: 16px;
  padding: 4px 8px 4px;
  background-color: black;
  border-radius: 4px;
  color: white;
  cursor: pointer;
`

interface Props {
  name: string,
  logo: string,
  removeLink: () => void,
}

const Account: React.FC<Props> = ({ name, logo, removeLink }: Props) => (
  <AccountDiv>
    <AccountInfo>
      <AccountLogo src={logo} alt={name + ' logo'} />
      <div>{name}</div>
    </AccountInfo>
    <RemoveLinkButton
      onClick={removeLink}
    >
      Remove Link
    </RemoveLinkButton>
  </AccountDiv>
)

export default Account
