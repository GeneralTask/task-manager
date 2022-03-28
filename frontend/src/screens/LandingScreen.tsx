import Cookies from 'js-cookie'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import styled from 'styled-components/native'
import GoogleSignInButton from '../components/atoms/buttons/GoogleSignInButton'
import JoinWaitlistButton from '../components/atoms/buttons/JoinWaitlistButton'
import UnauthorizedFooter from '../components/molecules/UnauthorizedFooter'
import UnauthorizedHeader from '../components/molecules/UnauthorizedHeader'
import { useAppSelector } from '../redux/hooks'
import { Navigate } from '../services/routing'
import { Colors, Flex, Images, Screens, Typography } from '../styles'
import apiClient from '../utils/api'

const FlexGrowContainer = styled.View`
    flex: 1;
`

const LandingScreen = () => {
    const [message, setMessage] = useState('')
    const { control, handleSubmit } = useForm({
        defaultValues: {
            email: '',
        },
    })
    const onWaitlistSubmit = (data: { email: string }) => {
        joinWaitlist(data.email)
    }
    const onWaitlistError = () => {
        setMessage('Email field is required')
    }

    const joinWaitlist = async (email: string) => {
        const response: Response = await apiClient.post('/waitlist/', {
            mode: 'cors',
            body: JSON.stringify({ email }),
        })
        if (response.ok) {
            setMessage('Success!')
        } else if (response.status === 302) {
            setMessage('This email already exists in the waitlist')
        } else {
            setMessage('There was an error adding you to the waitlist')
        }
    }
    const { authToken } = useAppSelector((state) => ({ authToken: state.user_data.auth_token }))
    const authCookie = Cookies.get('authToken')

    if (authToken || authCookie) {
        return <Navigate to="/tasks" />
    }

    const errorMessageView = (
        <View style={styles.responseContainer}>
            <Text style={styles.response}>{message}</Text>
        </View>
    )
    return (
        <View style={styles.container}>
            <UnauthorizedHeader />
            <FlexGrowContainer>
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>The task manager for highly productive people.</Text>
                    <Text style={styles.subheader}>
                        General Task pulls together your emails, messages, and tasks and prioritizes what matters most.{' '}
                    </Text>
                    <Text style={styles.subheader}></Text>
                </View>
                <View style={styles.waitlistContainer}>
                    <Controller
                        control={control}
                        rules={{
                            required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                onSubmitEditing={Keyboard.dismiss}
                                style={styles.input}
                                onChangeText={onChange}
                                value={value}
                                placeholder="Enter email address"
                            ></TextInput>
                        )}
                        name="email"
                    />
                    {Platform.OS === 'ios' && errorMessageView}
                    <JoinWaitlistButton onSubmit={handleSubmit(onWaitlistSubmit, onWaitlistError)} />
                </View>
                {Platform.OS === 'web' && errorMessageView}
                <GoogleSignInButton />
            </FlexGrowContainer>
            <UnauthorizedFooter />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Screens.container,
        ...Flex.column,
    },
    logo: {
        ...Platform.select({
            ios: {},
            default: {
                marginTop: '10px',
            },
        }),
        resizeMode: 'contain',
        width: Images.size.logo.header,
        height: Images.size.logo.header,
        marginLeft: 10,
    },
    headerContainer: {
        ...Platform.select({
            ios: {
                marginTop: '5%',
            },
        }),
    },
    header: {
        ...Platform.select({
            ios: {
                marginBottom: 10,
            },
            default: {
                marginBottom: '40px',
                maxWidth: '650px',
                margin: 'auto',
            },
        }),
        fontSize: Typography.fontSize.header,
        textAlign: 'center',
    },
    subheader: {
        ...Platform.select({
            ios: {},
            default: {
                maxWidth: '725px',
                margin: 'auto',
            },
        }),
        fontSize: Typography.fontSize.subheader,
        textAlign: 'center',
    },
    waitlistContainer: {
        ...Platform.select({
            ios: {
                ...Flex.columnCenter,
            },
            default: {
                ...Flex.row,
                height: '34px',
                marginLeft: 'auto',
                marginRight: 'auto',
                marginTop: '30px',
                width: '500px',
            },
        }),
    },
    input: {
        ...Platform.select({
            ios: {
                height: 45,
                margin: 12,
                borderWidth: 1,
                paddingLeft: 10,
                width: '80%',
            },
            default: {
                borderWidth: 1,
                flexGrow: 1,
                paddingLeft: '10px',
            },
        }),
    },
    responseContainer: {
        ...Platform.select({
            ios: {},
            default: {
                alignSelf: 'center',
                marginTop: '10px',
            },
        }),
    },
    response: {
        color: Colors.response.error,
    },
    footerContainer: {
        marginTop: 'auto',
    },
})

export default LandingScreen
