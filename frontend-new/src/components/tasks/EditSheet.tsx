import React from 'react'
import { View, Text } from 'react-native'
import { Colors, Flex } from '../../styles'

import { TTask } from '../../utils/types'
import Handle from '../atoms/Handle'


interface EditSheetProps {
    task: TTask
}

const EditSheet = ({ task }: EditSheetProps) => {
    return (
        <View
            style={{
                backgroundColor: Colors.white,
                padding: 16,
                height: 500,
                ...Flex.column,
            }}
        >
            <Handle />
            <Text>{task.title}</Text>
        </View>
    )
}

export default EditSheet
