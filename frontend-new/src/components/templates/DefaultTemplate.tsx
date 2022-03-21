import React from 'react'
import { StyleSheet, View } from 'react-native'
import ReactTooltip from 'react-tooltip'
import { Colors, Flex } from '../../styles'
import CalendarSidebar from '../calendar/CalendarSidebar'
import Navbar from '../views/NavigationView'
import '../../styles/tooltip.css'

interface DefaultTemplateProps {
    children: JSX.Element | JSX.Element[]
}
const DefaultTemplate = ({ children }: DefaultTemplateProps) => {
    const createTooltipView = (message: string) => <span>{message}</span>
    return (
        <View style={styles.container}>
            <ReactTooltip
                id="tooltip"
                effect="solid"
                delayShow={250}
                className="tooltip"
                backgroundColor={Colors.white}
                textColor={Colors.black}
                getContent={createTooltipView}
            />
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
        position: 'relative',
    },
})

export default DefaultTemplate
