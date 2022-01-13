import { WAITLIST_URL } from '../constants'
import React, { useState } from 'react'
import { getAuthToken, getHeaders } from '../helpers/utils'
import GLButton from './login/GoogleLoginButton'
import { device, TEXT_GRAY } from '../helpers/styles'
import styled from 'styled-components'
import LegacyHeader from './Header'
import { Navigate } from 'react-router-dom'

const Container = styled.div`
    margin: auto;
`
const Title = styled.div`
    font-size: 35px;
    text-align: center;
    margin-top: 60px;
    margin-bottom: 40px;
    @media ${device.mobile} {
        font-size: 58px;
    }
`
const Subtitle = styled.div`
    font-size: 18px;
    color: ${TEXT_GRAY};
    text-align: center;
    margin-bottom: 30px;
    @media ${device.mobile} {
        font-size: 27px;
    }
`
const WaitlistInput = styled.input`
    width: 60%;
    height: 100%;
    border: 1.5px solid black;
    border-radius: 2px 0 0 2px;
    color: ${TEXT_GRAY};
    box-sizing: border-box;
    text-align: center;
`
const JoinWaitlistButton = styled.button`
    width: 40%;
    height: 100%;
    border: 1.5px solid black;
    border-radius: 0 2px 2px 0;
    color: white;
    background-color: black;
    cursor: pointer;
`
const WaitlistDiv = styled.div`
    width: 90%;
    margin: auto;
    margin-bottom: 40px;
    @media ${device.mobile} {
        width: 500px;
    }
`
const WaitlistInputs = styled.form`
    height: 34px;
    display: flex;
    justify-content: center;
    width: 100%;
`
const WaitlistMessage = styled.div<{
    visibility: string
    backgroundColor: string
    color: string
}>`
    height: 34px;
    background-color: red;
    display: flex;
    align-items: center;
    justify-content: center;
    visibility: ${(props) => props.visibility};
    background-color: ${(props) => props.backgroundColor};
    border: 1.5px solid ${(props) => props.color};
    border-top: none;
    color: ${(props) => props.color};
`

enum WaitlistState {
    NONE,
    SUCCESS,
    EXISTS,
    ERROR,
}

const LandingPage: React.FC = () => {
    if (getAuthToken()) {
        return <Navigate to="/tasks/today" />
    }
    return (
        <div>
            <LegacyHeader isLoggedIn={Boolean(getAuthToken())} />
            <Container>
                <Title>
                    The task manager for
                    <br /> highly productive people.
                </Title>
                <Subtitle>
                    General Task pulls together your emails, messages, and tasks
                    <br />
                    and prioritizes what matters most.
                </Subtitle>
                <Waitlist />
                <GLButton />
            </Container>
        </div>
    )
}

export const Waitlist: React.FC = () => {
    const [waitlistState, setWaitlistState] = useState(WaitlistState.NONE)
    const [email, setEmail] = useState('')

    let messageVisibility = 'visible'
    let messageText
    let messageTextColor = 'black'
    let messageBackgroundColor = 'white'
    switch (waitlistState) {
        case WaitlistState.NONE:
            messageVisibility = 'hidden'
            messageText = ''
            break
        case WaitlistState.SUCCESS:
            messageText = "You've been added to the waitlist!"
            messageTextColor = '#4F8A10'
            messageBackgroundColor = '#DFF2BF'
            break
        case WaitlistState.EXISTS:
            messageText = 'This email already exists in the waitlist'
            messageTextColor = '#00529B'
            messageBackgroundColor = '#BDE5F8'
            break
        case WaitlistState.ERROR:
            messageText = 'There was an error adding you to the waitlist'
            messageTextColor = '#D8000C'
            messageBackgroundColor = '#FFD2D2'
            break
    }

    return (
        <WaitlistDiv>
            <WaitlistInputs
                onSubmit={(e) => {
                    e.preventDefault()
                    joinWaitlist(email, setWaitlistState)
                }}
            >
                <WaitlistInput
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <JoinWaitlistButton data-testid="join-waitlist-button" role="submit">
                    Join the Waitlist
                </JoinWaitlistButton>
            </WaitlistInputs>

            <WaitlistMessage
                data-testid="waitlist-message"
                visibility={messageVisibility}
                backgroundColor={messageBackgroundColor}
                color={messageTextColor}
            >
                {messageText}
            </WaitlistMessage>
        </WaitlistDiv>
    )
}

const joinWaitlist = async (email: string, setWaitlistState: (state: WaitlistState) => void) => {
    const response: Response = await fetch(WAITLIST_URL, {
        method: 'POST',
        mode: 'cors',
        headers: getHeaders(),
        body: JSON.stringify({ email }),
    })
    if (response.ok) {
        setWaitlistState(WaitlistState.SUCCESS)
    } else if (response.status === 302) {
        setWaitlistState(WaitlistState.EXISTS)
    } else {
        setWaitlistState(WaitlistState.ERROR)
    }
}

export default LandingPage
