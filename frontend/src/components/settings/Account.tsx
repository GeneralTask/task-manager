import { LinkedAccount } from '../../helpers/types'
import React from 'react'
import styled from 'styled-components'

const AccountDiv = styled.div`
  margin: auto;
  width: 90%;
  display: flex;
  justify-content: space-between; 
  align-items: center;
  font-size: 18px;
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
  linkedAccount: LinkedAccount,
  removeLink: () => void,
}

const Account: React.FC<Props> = ({ linkedAccount, removeLink }: Props) => (
  <AccountDiv>
    <AccountInfo>
      <AccountLogo src={linkedAccount.logo} alt={linkedAccount.name + ' logo'} />
      <div>{linkedAccount.name}</div>
    </AccountInfo>
    {linkedAccount.is_unlinkable && <RemoveLinkButton
      onClick={removeLink}
    >
      Remove Link
    </RemoveLinkButton>}
  </AccountDiv>
)

export default Account
