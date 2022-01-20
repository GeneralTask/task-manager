import React from 'react'
import { TLinkedAccount } from '../../helpers/types'
import styled from 'styled-components'

const AccountDiv = styled.div`
    margin-left: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    margin-bottom: 30px;
`
const AccountInfo = styled.div`
    display: flex;
    align-items: center;
    min-width: 300px;
`
const AccountLogo = styled.img`
    width: 35px;
    height: auto;
    margin-right: 30px;
`
const RemoveLinkButton = styled.button`
    min-width: 140px;
    font-size: 16px;
    padding: 4px 8px 4px;
    background-color: black;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    border: 1px solid black;
`

interface Props {
    linkedAccount: TLinkedAccount
    removeLink: () => void
}

const Account: React.FC<Props> = ({ linkedAccount, removeLink }: Props) => (
    <AccountDiv>
        <AccountInfo>
            <AccountLogo src={linkedAccount.logo} alt={linkedAccount.name + ' logo'} />
            <div>{linkedAccount.display_id}</div>
        </AccountInfo>
        {linkedAccount.is_unlinkable && <RemoveLinkButton onClick={removeLink}>Remove Link</RemoveLinkButton>}
    </AccountDiv>
)

export default Account
