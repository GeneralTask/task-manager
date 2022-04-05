import React, { Ref, forwardRef } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

import { Shadows } from '../../styles'

interface TaskTemplateProps {
    style?: ViewStyle
    isShadow?: boolean
    children: React.ReactNode | React.ReactNode[]
}
const TaskTemplate = forwardRef((props: TaskTemplateProps, ref) => {
    return (
        <View style={[props.style, styles.container]} ref={ref as Ref<View>}>
            {props.children}
        </View>
    )
})

const styles = StyleSheet.create({
    container: {
        width: '100%',
        position: 'relative',
        height: 34,
        borderRadius: 4,
        boxShadow: Shadows.xSmall,
    },
})

export default TaskTemplate
