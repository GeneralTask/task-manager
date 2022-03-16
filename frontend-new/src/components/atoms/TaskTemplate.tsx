import { StyleSheet, View, ViewStyle } from 'react-native'

import React from 'react'

interface TaskTemplateProps {
    style?: ViewStyle
    isShadow?: boolean
    children: React.ReactNode | React.ReactNode[]
}
const TaskTemplate = (props: TaskTemplateProps) => {
    return <View style={[props.style, styles.container]}>{props.children}</View>
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        position: 'relative',
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
})

export default TaskTemplate
