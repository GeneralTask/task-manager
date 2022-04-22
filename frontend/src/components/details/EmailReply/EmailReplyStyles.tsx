import { Border, Colors, Spacing } from '../../../styles'

import styled from 'styled-components'

export const EmailReplyContainer = styled.div`
    /* width: calc(100% - (${Spacing.padding._16}px * 2)); */
    padding: ${Spacing.padding._16}px;
    border: 2px solid ${Colors.purple._3};
    border-radius: ${Border.radius.large};
`
export const FullWidth = styled.div`
    width: 100%;
    display: flex;
`
export const FlexGrow = styled.div`
    flex: 1;
`
