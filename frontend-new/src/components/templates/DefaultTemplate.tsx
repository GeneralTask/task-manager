import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Colors, Flex } from '../../styles'
import CalendarSidebar from '../calendar/CalendarSidebar'
import Navbar from '../views/NavigationView'

interface DefaultTemplateProps {
    children: JSX.Element | JSX.Element[]
}
const DefaultTemplate = ({ children }: DefaultTemplateProps) => {
    return (
        <View style={styles.container}>
            <Navbar />
            {children}
            <CalendarSidebar />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.row,
        height: '100vh',
        fontFamily: 'Switzer-Variable',
        backgroundColor: Colors.gray._50,
        position: 'relative'
    }
})

export default DefaultTemplate
