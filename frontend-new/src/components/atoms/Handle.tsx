import React from "react"
import { View } from "react-native"
import { Colors } from "../../styles"

const Handle = () => {
    return (
        <View
            style={{
                backgroundColor: Colors.gray._200,
                height: 5,
                width: 40,
                borderRadius: 20,
                alignSelf: 'center',
            }}
        >
        </View>
    )
}

export default Handle
