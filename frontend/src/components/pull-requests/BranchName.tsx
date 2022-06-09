import { Border, Colors, Spacing } from '../../styles'

import { Icon } from '../atoms/Icon'
import React from 'react'
import { TruncatedText } from './styles'
import { icons } from '../../styles/images'
import styled from 'styled-components'

const BranchNameContainer = styled.div`
    display: flex;
    align-items: center;
    border: 0.5px solid ${Colors.gray._200};
    border-radius: ${Border.radius.regular};
    padding: ${Spacing.padding._4} ${Spacing.padding._4};
    cursor: pointer;
`

interface BranchNameProps {
    name: string
}
const BranchName = ({ name }: BranchNameProps) => {
    return (
        <BranchNameContainer>
            <TruncatedText>{name}</TruncatedText>
            <div>
                <Icon size="small" source={icons.copy} />
            </div>
        </BranchNameContainer>
    )
}

export default BranchName
