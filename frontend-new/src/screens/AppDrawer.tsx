import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem, DrawerContentComponentProps } from '@react-navigation/drawer'
import { getHeaderTitle } from '@react-navigation/elements'
import React from 'react'
import { useWindowDimensions, View, StyleSheet, Text, Image, Pressable } from 'react-native'
import TasksScreen from './TasksScreen'
import { Colors, Flex, Typography } from '../../src/styles'
import { useGetTasksQuery } from '../services/generalTaskApi'
import { SafeAreaView } from 'react-native-safe-area-context'
import { authSignOut } from '../utils/auth'
import { useAppDispatch } from '../redux/hooks'
import { ScreenDimensions } from '../constants'
const AppDrawer = () => {
    const { data: taskSections, isLoading } = useGetTasksQuery()

    const Drawer = createDrawerNavigator()
    const dimensions = useWindowDimensions()

    const isLargeScreen = dimensions.width >= ScreenDimensions.large

    return (
        isLoading || !taskSections ? <></> :
            <Drawer.Navigator
                screenOptions={{
                    drawerType: isLargeScreen ? 'permanent' : 'slide',
                    header: ({ navigation, route, options }) => {
                        const title = getHeaderTitle(options, route.name)
                        return (
                            <Pressable onPress={() => navigation.openDrawer()} >
                                <Header title={title}></Header>
                            </Pressable>
                        )
                    },
                    drawerItemStyle: styles.drawerButton,
                    drawerIcon: ({ size }) => {
                        return (
                            <Image
                                source={require('../assets/inbox.png')}
                                style={{ width: size, height: size }}
                            />
                        )
                    },
                }}
                drawerContent={(props) => <DrawerContent {...props} />}>
                {
                    taskSections.map((section, index) => (
                        <Drawer.Screen
                            key={section.id}
                            name={section.name}
                            component={TasksScreen}
                            initialParams={{ index: index }}
                        />
                    ))
                }
            </Drawer.Navigator>
    )
}

const DrawerContent = (props: DrawerContentComponentProps): JSX.Element => {
    const dispatch = useAppDispatch()
    return (
        <SafeAreaView style={styles.safeAreaStyle}>
            <View style={styles.container}>
                <Image style={styles.logo} source={require('../assets/logo.png')} />
            </View>
            <DrawerContentScrollView {...props}>
                <DrawerItemList {...props} />
            </DrawerContentScrollView>
            <View>
                <DrawerItem
                    label="Sign Out"
                    onPress={() => authSignOut(dispatch)}
                    style={styles.drawerButton}
                />
            </View>
        </SafeAreaView>
    )
}
interface HeaderProps {
    title: string
}
const Header = ({ title }: HeaderProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.containerInner}>
                <Image style={styles.logo} source={require('../assets/logo.png')} />
                <Image style={styles.inboxIcon} source={require('../assets/inbox.png')} />
                <Text style={styles.textFolder}>{'All /'}</Text>
                <Text style={styles.textPage}>{title}</Text>
            </View>
            <View style={styles.containerInner}>
                {/* TODO: Search, Notifications, Calendar buttons */}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    safeAreaStyle: {
        flex: 1,
        backgroundColor: Colors.gray._100,
    },
    container: {
        ...Flex.row,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
    },
    containerInner: {
        ...Flex.row,
        alignItems: 'center',
    },
    textFolder: {
        ...Typography.xSmall,
        marginLeft: 5,
        color: Colors.gray._500,
    },
    textPage: {
        ...Typography.xSmall,
        marginLeft: 5,
        color: Colors.gray._700,
    },
    logo: {
        width: 24,
        height: 24,
        marginLeft: 5,
    },
    inboxIcon: {
        width: 16,
        height: 16,
        marginLeft: 5,
    },
    drawerIcon: {
        width: 16,
        height: 16,
        marginLeft: 5,
    },
    drawerButton: {
        borderRadius: 10,
    },
})

export default AppDrawer

