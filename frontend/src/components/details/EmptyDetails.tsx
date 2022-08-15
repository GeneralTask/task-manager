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
    gap: ${Spacing.margin._16};
`
const Text = styled.span`
    color: ${Colors.text.light};
    ${Typography.title};
`

interface EmptyDetailsProps {
    iconSource: string
    text: string
}

const EmptyDetails = ({ iconSource, text }: EmptyDetailsProps) => {
    return (
        <DetailsViewContainer>
            <Icon size="xLarge" source={iconSource} />
            <Text>{text}</Text>
        </DetailsViewContainer>
    )
}

export default EmptyDetails
