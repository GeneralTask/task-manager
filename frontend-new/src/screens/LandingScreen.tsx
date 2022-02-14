import React from 'react'
import { View, Text, Button, StyleSheet, TextInput, SafeAreaView, Image, ScrollView, Platform, Pressable } from 'react-native'
import { useForm, Controller } from 'react-hook-form'

export const getHeaders = (): Record<string, string> => {
    const date = new Date()
    return {
        'Access-Control-Allow-Origin': 'http://localhost:19006',
        'Access-Control-Allow-Headers':
            'Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
        'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
        'Timezone-Offset': date.getTimezoneOffset().toString(),
    }
}

const joinWaitlist = async (email: string) => {
    const response: Response = await fetch('http://localhost:8080/waitlist/', {
        method: 'POST',
        mode: 'cors',
        headers: getHeaders(),
        body: JSON.stringify({ email }),
    })
    console.log(response)
}


const JoinWaitlistButton = () => {
    const title = 'Join the Waitlist'
    if (Platform.OS === 'ios') {
        return <Button onPress={() => { }} title={title} />
    }
    return <button style={{
        height: '100%',
        border: '1.5px solid black',
        borderRadius: '0 2px 2px 0',
        color: 'white',
        backgroundColor: 'black',
        cursor: 'pointer',
        flexGrow: '1',
    }}>{title}</button>
}


type FormData = {
    email: string
}
const Landing = () => {
    const { control, handleSubmit } = useForm({
        defaultValues: {
            email: '',
        }
    })
    const onSubmit = (data: any) => {
        joinWaitlist(data.email)
        console.log(data)
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
                <Button onPress={handleSubmit(onSubmit)} title="Join the Waitlist" />
            </View>
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
            },
            default: {
                borderWidth: 1,
                flexGrow: 1,
                paddingLeft: '10px',
            }
        })
    }
})

export default Landing
