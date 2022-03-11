import { StyleSheet, View, ViewStyle } from 'react-native'

import { Flex } from '../../styles'
import React from 'react'

interface TaskTemplateProps {
    style?: ViewStyle
    isShadow?: boolean
    children: React.ReactNode | React.ReactNode[]
}
const TaskTemplate = (props: TaskTemplateProps) => {
    return (
        <View style={[props.style, styles.container]}>
            {props.children}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 60,
        ...Flex.verticalAlign,
    }
})

export default TaskTemplate
