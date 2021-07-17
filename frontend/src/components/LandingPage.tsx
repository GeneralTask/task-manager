import { LOGIN_URL, WAITLIST_URL } from '../constants'
import React, { useState } from 'react'
import { getAuthToken, getHeaders } from '../helpers/utils'

import GLButton from './login/GoogleLogin'
import TaskList from './task/TaskList'
import { textDark } from '../helpers/styles'
import styled from 'styled-components'

const Logo = styled.div`
  font-weight: bold;
  font-size: 32px;
  margin-left: 10px;
  margin-top: 10px;
  padding: 20px; 
`
const Container = styled.div`
  width: 65%;
  margin: auto;
`
const Title = styled.div`
  font-size: 58px;
  text-align: center;
  margin-top: 60px;
  margin-bottom: 40px;
`
const Subtitle = styled.div`
  font-size: 27px;
  color: ${textDark};
  text-align: center;
  margin-bottom: 30px;
`
const WaitlistInput = styled.input`
  width: 250px;
  height: 100%;
  border: 1.5px solid black;
  border-radius: 2px 0 0 2px;
  color: ${textDark};
  box-sizing: border-box;
  text-align: center;
`
const JoinWaitlistButton = styled.button`
  width: 200px;
  height: 100%;
  border: 1.5px solid black;
  border-radius: 0 2px 2px 0;
  color: white;
  background-color: black;
`
const WaitlistDiv = styled.div`
  width: 450px;
  margin: auto;
  margin-bottom: 40px;
`
const WaitlistInputs = styled.form`
  height: 34px;
  text-align: center;
`
const WaitlistMessage = styled.div<{ visibility: string, backgroundColor: string, color: string }>`
  height: 34px;
  background-color: red;
  display: flex;
  align-items: center;
  justify-content: center;
  visibility: ${props => props.visibility};
  background-color: ${props => props.backgroundColor};
  border: 1.5px solid ${props => props.color};
  border-top: none;
  color: ${props => props.color};
`
const LoginWithGoogle = styled.a`
  border: 1px solid ;
  border-radius: 2px;
  margin: auto;
  margin-bottom: 50px;
  display: flex;
  width: 200px;
  color: ${textDark};
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 4px;
`

enum WaitlistState {
  NONE,
  SUCCESS,
  EXISTS,
  ERROR,
}

const LandingPage: React.FC = () => {
  if (getAuthToken()) {
    return <TaskList />
  }
  return (
    <div>
      <Logo>General Task</Logo>
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
        <LoginWithGoogle href={LOGIN_URL} role="button">
          <GLButton />
          Sign in with Google
        </LoginWithGoogle>
      </Container>
    </div>
  )
}

const Waitlist = () => {
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
      messageText = 'You\'ve been added to the waitlist!'
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
      <WaitlistInputs onSubmit={(e) => {
        e.preventDefault()
        joinWaitlist(email, setWaitlistState)
      }}>
        <WaitlistInput placeholder="Enter email address" value={email} onChange={e => setEmail(e.target.value)} />
        <JoinWaitlistButton role="submit">
          Join the Waitlist
        </JoinWaitlistButton>
      </WaitlistInputs>

      <WaitlistMessage visibility={messageVisibility} backgroundColor={messageBackgroundColor} color={messageTextColor}>
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
  }
  else if (response.status === 302) {
    setWaitlistState(WaitlistState.EXISTS)
  }
  else {
    setWaitlistState(WaitlistState.ERROR)
  }

}

export default LandingPage
