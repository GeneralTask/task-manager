import React from 'react'
import styled from 'styled-components'

const AccountDiv = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 24px;
    margin-bottom: 30px;
`;
const AccountLogo = styled.img`
    height: 35px;
`;
const ConnectButton = styled.button`
    font-size: 20px;
    padding: 4px 8px 4px;
    background-color: black;
    border-radius: 4px;
    color: white;
    cursor: pointer;
`;

function Account(props) {
    return (
        <AccountDiv>
            <AccountLogo src={props.logo} alt={props.name + " logo"} />
            <div>{props.name}</div>
            <ConnectButton onClick={() => {
                window.open(props.link, props.name, 'height=640,width=960,toolbar=no,menubar=no,scrollbars=no,location=no,status=no')
            }} >Connect</ConnectButton>
        </AccountDiv>
    )
}

export default Account;
