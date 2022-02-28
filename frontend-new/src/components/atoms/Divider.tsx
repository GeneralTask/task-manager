import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Colors } from '../../styles'

export const Divider = () => <View style={styles.divider} />

const styles = StyleSheet.create({
    divider: {
        backgroundColor: Colors.gray._100,
        height: 1,
        width: '100%',
    },
})
