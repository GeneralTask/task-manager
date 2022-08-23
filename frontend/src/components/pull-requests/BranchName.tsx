import { BranchNameContainer, TruncatedText } from './styles'

import { Icon } from '../atoms/Icon'
import React from 'react'
import TooltipWrapper from '../atoms/TooltipWrapper'
import { icons } from '../../styles/images'
import toast from '../../utils/toast'
import { Colors } from '../../styles'

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
                theme: 'dark',
            }
        )
    }
    return (
        <TooltipWrapper dataTip={name} tooltipId="tooltip">
            <BranchNameContainer onClick={handleClick}>
                <TruncatedText>{name}</TruncatedText>
                <Icon size="xSmall" icon={icons.copy} color={Colors.icon.purple} />
            </BranchNameContainer>
        </TooltipWrapper>
    )
}

export default BranchName
