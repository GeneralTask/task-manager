import { Border, Colors, Shadows, Spacing, Typography } from '../../../../styles'

import NoStyleButton from '../../../atoms/buttons/NoStyleButton'
import styled from 'styled-components'

export const EmailFieldContainer = styled.div`
    margin: 0;
    flex: 1 0 auto;
    padding: ${Spacing.padding._4} ${Spacing.padding._8};
    color: ${Colors.black};
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    row-gap: ${Spacing.margin._8};
    gap: ${Spacing.margin._8};
`
export const EmailFieldInput = styled.input`
    min-width: 20%;
    background-color: inherit;
    outline: none;
    border: none;
    line-height: 1;
    vertical-align: baseline !important;
    padding: 0;
    flex: 1;
    font-size: ${Typography.xSmall.fontSize};
    height: 30px;
`
export const EmailComposeContainer = styled.div`
    display: flex;
    margin-bottom: ${Spacing.margin._16};
`
export const EmailRecipientsContainer = styled.div`
    display: flex;
    max-width: 100%;
    align-content: flex-start;
    flex-wrap: wrap;
`
export const EmailTag = styled.div`
    max-width: 100%;
    padding: ${Spacing.padding._4} ${Spacing.padding._8};
    border: 1px solid ${Colors.gray._200};
    border-radius: ${Border.radius.large};
    display: flex;
    align-items: center;
    gap: ${Spacing.margin._4};
    background-color: ${Colors.gray._100};
`
export const EmailTagText = styled.span`
    max-width: 300px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`
export const EmailActionButtonContainer = styled.div`
    width: calc(100% / 3);
    padding: ${Spacing.padding._8};
`
export const EmailActionButton = styled(NoStyleButton)`
    background-color: ${Colors.gray._100};
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: ${Shadows.small};
    width: 100%;
    padding: ${Spacing.padding._8} 0;
`
export const ButtonsContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing.margin._8};
    padding: ${Spacing.padding._8};
`
export const BodyContainer = styled.div`
    height: 150px;
`
export const AddEmailRecipientsContainer = styled.div`
    display: flex;
    align-items: center;
    margin-left: auto;
    padding: 0 ${Spacing.padding._8};
    gap: ${Spacing.margin._4};
`
export const AddEmailRecipientsButton = styled(NoStyleButton)`
    border: 2px solid ${Colors.gray._100};
    border-radius: ${Border.radius.regular};
    padding: ${Spacing.padding._4} ${Spacing.padding._8};
    font-size: ${Typography.xSmall.fontSize};
`
export const FlexExpand = styled.div`
    flex: 1;
`
export const Flex = styled.div`
    display: flex;
`
export const SentEmailBanner = styled.div`
    background-color: ${Colors.black};
    color: ${Colors.white};
    margin: ${Spacing.margin._8};
    border-radius: ${Border.radius.small};
    padding: ${Spacing.padding._8} ${Spacing.padding._16};
    display: flex;
    justify-content: space-between;
    align-items: center;
`
export const UndoButton = styled(NoStyleButton)`
    background-color: ${Colors.purple._1};
    border-radius: ${Border.radius.small};
    padding: ${Spacing.padding._8} ${Spacing.padding._16};
`
export const ComposeSelectorButtonContainer = styled.div`
    display: flex;
    align-items: center;
    height: 30px;
    margin: ${Spacing.margin._4} 0 0 ${Spacing.margin._8};
`
export const EmailActionOption = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing.padding._8};
`
export const EmailComposeIconButton = styled(NoStyleButton) <{ hasBorder: boolean, isPressed: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid ${(props) => (props.hasBorder ? Colors.gray._200 : 'transparent')};
    background-color: ${(props) => (props.isPressed ? Colors.gray._200 : 'inherit')};
    border-radius: ${Border.radius.xxSmall};
    position: relative;
    padding: ${Spacing.padding._4};
    min-height: 20px;
    min-width: 20px;
    &:hover {
        background-color: ${Colors.gray._200};
    }
`
export const NoWrap = styled.span`
    white-space: nowrap;
`
