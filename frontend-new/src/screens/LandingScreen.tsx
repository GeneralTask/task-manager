import React, { useState } from 'react'
import { View, Text, Button, StyleSheet, TextInput, SafeAreaView, Image, ScrollView, Platform, Pressable } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { getHeaders } from '../api'

const JoinWaitlistButton = (props: { onSubmit: () => void }) => {
    const title = 'Join the Waitlist'
    if (Platform.OS === 'ios') {
        return <Button onPress={props.onSubmit} title={title} />
    }
    return <button onClick={props.onSubmit} style={{
        height: '100%',
        border: '1.5px solid black',
        borderRadius: '0 2px 2px 0',
        color: 'white',
        backgroundColor: 'black',
        cursor: 'pointer',
        flexGrow: '1',
    }}>{title}</button>
}

const LandingScreen = () => {
    const [message, setMessage] = useState('')
    const { control, handleSubmit } = useForm({
        defaultValues: {
            email: '',
        }
    })

    const joinWaitlist = async (email: string) => {
        const response: Response = await fetch('http://localhost:8080/waitlist/', {
            method: 'POST',
            mode: 'cors',
            headers: getHeaders(),
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

    const onSubmit = (data: any) => {
        joinWaitlist(data.email)
    }
    return (
        <View style={styles.container}>
            <Image style={styles.logo} source={require('../../assets/generaltask.png')} />
            <View style={styles.headerContainer}>
                <Text style={styles.header}>The task manager for highly productive people.</Text>
                <Text style={styles.subheader}>General Task pulls together your emails, messages, and tasks and prioritizes what matters most. </Text>
                <Text style={styles.subheader}></Text>
            </View>
            <View style={styles.waitlistContainer}>
                <Controller
                    control={control}
                    rules={{
                        required: true,
                    }}
                    render={({ field: { onChange, value } }) => (
                        <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder='Enter email address'></TextInput>
                    )}
                    name="email"
                />
                {
                    Platform.OS === 'ios' &&
                    <View style={styles.responseContainer}>
                        <Text style={styles.response}>{message}</Text>
                    </View>
                }
                <JoinWaitlistButton onSubmit={handleSubmit(onSubmit)} />
            </View>
            {
                Platform.OS === 'web' &&
                <View style={styles.responseContainer}>
                    <Text style={styles.response}>{message}</Text>
                </View>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',

    },
    logo: {
        ...Platform.select({
            ios: {
                width: 50,
                height: 50,
                resizeMode: 'contain',
            },
            default: {
                width: '50px',
                height: '50px',
                resizeMode: 'contain',
                marginTop: '10px',
            }
        }),
        marginLeft: 10,
    },
    headerContainer: {
        ...Platform.select({
            ios: {
                marginTop: '5%',
            },
            default: {
            }
        }),
    },
    header: {
        ...Platform.select({
            ios: {
                fontSize: 33,
                marginBottom: 10,
            },
            default: {
                fontSize: 58,
                marginBottom: '40px',
                maxWidth: '650px',
                margin: 'auto',
            }
        }),
        textAlign: 'center',
    },
    subheader: {
        ...Platform.select({
            ios: {
                fontSize: 16,
            },
            default: {
                fontSize: 27,
                maxWidth: '725px',
                margin: 'auto',
            }
        }),
        textAlign: 'center',
    },
    waitlistContainer: {
        ...Platform.select({
            ios: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            },
            default: {
                display: 'flex',
                height: '34px',
                flexDirection: 'row',
                marginLeft: 'auto',
                marginRight: 'auto',
                marginTop: '30px',
                width: '500px',
            }
        })
    },
    input: {
        ...Platform.select({
            ios: {
                height: 45,
                margin: 12,
                borderWidth: 1,
                fontSize: 18,
                paddingLeft: 10,
                width: '80%',
            },
            default: {
                borderWidth: 1,
                flexGrow: 1,
                paddingLeft: '10px',
            }
        })
    },
    responseContainer: {
        ...Platform.select({
            ios: {

            },
            default: {
                alignSelf: 'center',
                marginTop: '10px',
            }
        })
    },
    response: {
        color: 'red',
    }
})

export default LandingScreen
