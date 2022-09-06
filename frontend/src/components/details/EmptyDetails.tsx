import { IconProp } from '@fortawesome/fontawesome-svg-core'
import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { Icon } from '../atoms/Icon'

const DetailsViewContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.background.light};
    min-width: 300px;
    justify-content: center;
    align-items: center;
    gap: ${Spacing._16};
`
const Text = styled.span`
    color: ${Colors.text.light};
    ${Typography.title};
`

interface EmptyDetailsProps {
    icon: IconProp | string
    text: string
}

const EmptyDetails = ({ icon, text }: EmptyDetailsProps) => {
    return (
        <DetailsViewContainer>
            <Icon size="xLarge" icon={icon} />
            <Text>{text}</Text>
        </DetailsViewContainer>
    )
}

export default EmptyDetails
