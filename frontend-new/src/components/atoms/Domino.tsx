import React from 'react'
import { gray } from '../../styles/colors'
import { View, StyleSheet } from 'react-native'


export default function Domino(): JSX.Element {
    return (
        <View style={styles.DominoOuterContainer}>
            <View style={styles.DominoInnerContainer}>
                {Array(6)
                    .fill(0)
                    .map((_, index) => (
                        <View style={styles.DominoDot} key={index} />
                    ))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    DominoOuterContainer: {
        height: '60%',
        // cursor: 'grab',
        display: 'flex',
        flexWrap: 'wrap',
        paddingLeft: 12,
        paddingRight: 12,
    },
    DominoInnerContainer: {
        height: '100%',
        width: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        alignItems: 'center',
    },
    DominoDot: {
        width: 3,
        height: 3,
        borderRadius: 50,
        backgroundColor: gray._400,
        margin: 1,
    },
})
