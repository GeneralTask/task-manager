import { Colors, Typography } from '../../styles'
import { Controller, useForm } from 'react-hook-form'
import React, { useState } from 'react'

import Cookies from 'js-cookie'
import GoogleSignInButton from '../atoms/buttons/GoogleSignInButton'
import JoinWaitlistButton from '../atoms/buttons/JoinWaitlistButton'
import { Link, Navigate } from 'react-router-dom'
import UnauthorizedFooter from '../molecules/UnauthorizedFooter'
import UnauthorizedHeader from '../molecules/UnauthorizedHeader'
import apiClient from '../../utils/api'
import styled from 'styled-components'
import { AUTHORIZATION_COOKE } from '../../constants'

const LandingScreenContainer = styled.div`
    background-color: ${Colors.white};
    height: 100vh;
    display: flex;
    flex-direction: column;
`
const FlexColumn = styled.div`
    display: flex;
    flex-direction: column;
`
const FlexGrowContainer = styled.div`
    flex: 1;
`
const Header = styled.div`
    max-width: 700px;
    margin: auto;
    margin-bottom: 40px;
    text-align: center;
    ${Typography.header};
`
const Subheader = styled.div`
    max-width: 725px;
    margin: auto;
    text-align: center;
    ${Typography.title};
`
const WaitlistContainer = styled.div`
    display: flex;
    flex-direction: row;
    height: 35px;
    margin: auto;
    margin-top: 30px;
    width: 500px;
`
const WaitlistTextInput = styled.input`
    outline: none;
    flex: 1;
    padding: 0px 10px;
`
const ResponseContainer = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 20px;
    height: 20px;
    color: ${Colors.response.error};
`

const FAQHeader = styled.div`
    max-width: 700px;
    margin: auto;
    margin-bottom: 20px;
    margin-top: 100px;
    text-align: center;
    ${Typography.title};
`

const FAQItem = styled.div`
    max-width: 725px;
    margin: auto;
    margin-top: 10px;
    margin-bottom: 30px;
    text-align: center;
    ${Typography.body};
`

const LandingScreen = () => {
    const [message, setMessage] = useState('')
    const { control, handleSubmit } = useForm({
        defaultValues: {
            email: '',
        },
    })
    if (Cookies.get(AUTHORIZATION_COOKE)) return <Navigate to="/overview" />

    const onWaitlistSubmit = (data: { email: string }) => {
        joinWaitlist(data.email)
    }
    const onWaitlistError = () => {
        setMessage('Email field is required')
    }

    const joinWaitlist = async (email: string) => {
        const response: Response = await apiClient.post('/waitlist/', {
            email: email,
        })
        if (response.status === 201) {
            setMessage('Success!')
        } else if (response.status === 302) {
            setMessage('This email already exists in the waitlist')
        } else {
            setMessage('There was an error adding you to the waitlist')
        }
    }

    return (
        <LandingScreenContainer>
            <UnauthorizedHeader />
            <FlexGrowContainer>
                <FlexColumn>
                    <Header>The task manager for highly productive people.</Header>
                    <Subheader>General Task pulls together your tasks and prioritizes what matters most. </Subheader>
                    <Subheader></Subheader>
                </FlexColumn>
                <WaitlistContainer>
                    <Controller
                        control={control}
                        rules={{
                            required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <WaitlistTextInput
                                type="text"
                                onChange={onChange}
                                value={value}
                                placeholder="Enter email address"
                            />
                        )}
                        name="email"
                    />
                    <JoinWaitlistButton onSubmit={handleSubmit(onWaitlistSubmit, onWaitlistError)} />
                </WaitlistContainer>
                <ResponseContainer data-testid="response-container">{message}</ResponseContainer>
                <GoogleSignInButton />
            </FlexGrowContainer>
            <FlexGrowContainer>
                <FlexColumn>
                    <FAQHeader>Google Privacy FAQs</FAQHeader>
                    <Subheader>What will your app do with Google user data?</Subheader>
                    <FAQItem>
                        General Task stores user data to power features like our calendar view and unified task manager.
                        General Task&#39;s use and transfer to any other app of information received from Google APIs
                        will adhere to{' '}
                        <a
                            href="https://developers.google.com/terms/api-services-user-data-policy"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Google API Services User Data Policy
                        </a>
                        , including the{' '}
                        <a
                            href="https://support.google.com/cloud/answer/9110914#explain-types"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Limited Use requirements
                        </a>
                        . Read more about how we use data in our <Link to="/privacy-policy">Privacy Policy</Link>.
                    </FAQItem>
                    <Subheader>How does your app enhance Google user functionality?</Subheader>
                    <FAQItem>
                        Our app enhances user functionality by allowing you to track everything on your plate at work in
                        one unified place. You can view your Google calendar in-app and will soon be able to modify and
                        create events.
                    </FAQItem>
                </FlexColumn>
            </FlexGrowContainer>
            <UnauthorizedFooter />
        </LandingScreenContainer>
    )
}

export default LandingScreen
