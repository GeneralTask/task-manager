import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

const MAX_POPUP_LENGTH = 315
const MAX_POPUP_HEIGHT = 500

export const EventBoxStyle = styled.div`
    box-sizing: border-box;
    padding: ${Spacing._16} ${Spacing._16};
    width: ${MAX_POPUP_LENGTH}px;
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`
export const EventHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${Spacing._8};
`
export const EventHeaderIcons = styled.div`
    display: flex;
    align-items: center;
`
export const IconButton = styled(NoStyleButton)`
    padding: ${Spacing._8};
    border-radius: 50vh;
    &:hover {
        background-color: ${Colors.background.sub};
    }
`
export const EventTitle = styled.span`
    color: ${Colors.text.black};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    ${Typography.deprecated_bodySmall}
`
export const Description = styled.div`
    ${Typography.deprecated_label};
    color: ${Colors.text.black};
    overflow-wrap: break-word;
    overflow-y: auto;
    max-height: ${MAX_POPUP_HEIGHT}px;
    margin-bottom: ${Spacing._16};
    white-space: pre-wrap;
`
export const FlexAnchor = styled(NoStyleAnchor)`
    flex: 1;
`
export const CopyButton = styled(IconButton)`
    margin: 0 ${Spacing._8};
`
export const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    cursor: default;
`
