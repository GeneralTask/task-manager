import { Flex, Spacing } from '../../styles'
import { StyleSheet, View } from 'react-native'

import React from 'react'
import { gray } from '../../styles/colors'
import styled from 'styled-components'

const DominoOuterContainer = styled.div`
    cursor: grab;
    height: ${Spacing.margin._16}px;
    padding-left: ${Spacing.padding._4}px;
    padding-right: ${Spacing.padding._12}px;
`

const Domino = React.forwardRef<HTMLDivElement>((_, ref) => {
    return (
        <DominoOuterContainer ref={ref}>
            <View style={styles.DominoInnerContainer}>
                {Array(6)
                    .fill(0)
                    .map((_, index) => (
                        <View style={styles.DominoDot} key={index} />
                    ))}
            </View>
        </DominoOuterContainer>
    )
})

const styles = StyleSheet.create({
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
