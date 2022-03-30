import styled, { css } from "styled-components/native"
import WebStyled from 'styled-components'
import { Border, Colors, Spacing } from "../../styles"
import { Platform } from "react-native"
import React from "react"

const ItemContainerStyle = css<{ isSelected: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    background-color: ${Colors.white};
    border-radius: ${Border.radius.xxSmall};
    padding: 0 ${Spacing.padding.small}px;
    border: 1px solid ${(props) => (props.isSelected ? Colors.gray._500 : Colors.gray._100)};
`
const ItemContainerWeb = WebStyled.div<{ isSelected: boolean }>`${ItemContainerStyle}`
const ItemContainerNative = styled.Pressable<{ isSelected: boolean }>`
    ${ItemContainerStyle}
`

interface ItemContainerProps {
    isSelected: boolean
    onPress: () => void
    children: React.ReactNode | React.ReactNode[]
}
const ItemContainer = React.forwardRef<HTMLDivElement, ItemContainerProps>(({ isSelected, onPress, children }, ref) => {
    if (Platform.OS === 'web') {
        return (
            <ItemContainerWeb isSelected={isSelected} onClick={onPress} ref={ref}>
                {children}
            </ItemContainerWeb>
        )
    } else {
        return (
            <ItemContainerNative isSelected={isSelected} onPress={onPress}>
                {children}
            </ItemContainerNative>
        )
    }
})

export default ItemContainer
