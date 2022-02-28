import React from "react"
import { StyleSheet, View } from "react-native"
import { Colors } from "../../styles"

const Handle = () => <View style={styles.handle} />

const styles = StyleSheet.create({
    handle: {
        backgroundColor: Colors.gray._200,
        height: 5,
        width: 40,
        borderRadius: 20,
        alignSelf: 'center',
    }
})

export default Handle
