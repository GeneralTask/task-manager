import React, { ForwardedRef } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

interface TaskTemplateProps {
    style?: ViewStyle
    isShadow?: boolean
    children: React.ReactNode | React.ReactNode[]
}
const TaskTemplate = React.forwardRef((props: TaskTemplateProps, ref: ForwardedRef<null>) => (
    <View style={[props.style, styles.container]} ref={ref}>
        {props.children}
    </View>
))

const styles = StyleSheet.create({
    container: {
        width: '100%',
        position: 'relative',
        height: 48,
        borderRadius: 12,
    },
})

export default TaskTemplate
