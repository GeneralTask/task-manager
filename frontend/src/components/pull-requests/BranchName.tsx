import { Border, Colors, Spacing } from '../../styles'

import { Icon } from '../atoms/Icon'
import React from 'react'
import TooltipWrapper from '../atoms/TooltipWrapper'
import { TruncatedText } from './styles'
import { icons } from '../../styles/images'
import styled from 'styled-components'
import toast from '../../utils/toast'

const BranchNameContainer = styled.div`
    display: flex;
    align-items: center;
    color: ${Colors.purple._1};
    border: 0.5px solid ${Colors.gray._200};
    border-radius: ${Border.radius.regular};
    padding: ${Spacing.padding._4} ${Spacing.padding._4};
    cursor: pointer;
`

interface BranchNameProps {
    name: string
}
const BranchName = ({ name }: BranchNameProps) => {
    const handleClick = async () => {
        await navigator.clipboard.writeText(name)
        toast(
            {
                message: 'Branch copied to clipboard',
            },
            {
                autoClose: 2000,
                pauseOnFocusLoss: false,
            }
        )
    }
    return (
        <TooltipWrapper dataTip={name} tooltipId="tooltip">
            <BranchNameContainer onClick={handleClick}>
                <TruncatedText>{name}</TruncatedText>
                <div>
                    <Icon size="xSmall" source={icons.copy} />
                </div>
            </BranchNameContainer>
        </TooltipWrapper>
    )
}

export default BranchName
