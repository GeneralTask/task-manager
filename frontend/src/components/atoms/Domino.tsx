import { Platform, StyleSheet, View } from 'react-native'

import { Flex } from '../../styles'
import React from 'react'
import { gray } from '../../styles/colors'

const Domino = React.forwardRef<HTMLDivElement>((_, ref) => {
    return (
        <div style={styles.DominoOuterContainer} ref={ref}>
            <View style={styles.DominoInnerContainer}>
                {Array(6)
                    .fill(0)
                    .map((_, index) => (
                        <View style={styles.DominoDot} key={index} />
                    ))}
            </View>
        </div>
    )
})

const styles = StyleSheet.create({
    DominoOuterContainer: {
        ...Platform.select({
            web: {
                cursor: 'grab',
            },
        }),
        height: 16,
        paddingLeft: 4,
        paddingRight: 12,
    },
    DominoInnerContainer: {
        height: '100%',
        width: 10,
        ...Flex.wrap,
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

export default React.memo(Domino)
