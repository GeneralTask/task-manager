import { IconProp } from '@fortawesome/fontawesome-svg-core'
import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { Icon } from '../atoms/Icon'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'

const EmptyMessage = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
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
        <DetailsViewTemplate>
            <EmptyMessage>
                <Icon size="xLarge" icon={icon} />
                <Text>{text}</Text>
            </EmptyMessage>
        </DetailsViewTemplate>
    )
}

export default EmptyDetails
