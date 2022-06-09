import { BranchNameContainer, TruncatedText } from './styles'

import { Icon } from '../atoms/Icon'
import React from 'react'
import TooltipWrapper from '../atoms/TooltipWrapper'
import { icons } from '../../styles/images'
import toast from '../../utils/toast'

interface BranchNameProps {
    name: string
}
const BranchName = ({ name }: BranchNameProps) => {
    const handleClick = () => {
        navigator.clipboard.writeText(name)
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
