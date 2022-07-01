import React from 'react'
import styled from 'styled-components'
import { useGetSupportedViews } from '../../services/api/overview.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import GTCheckmark from '../atoms/GTCheckmark'
import GTModal from '../atoms/GTModal'
import { Icon } from '../atoms/Icon'

const SupportedView = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing.padding._8};
`
const LeftSide = styled.div`
    display: flex;
    align-items: center;
    color: ${Colors.gray._600};
    gap: ${Spacing.margin._8};
    font-size: ${Typography.small.fontSize};
    line-height: ${Typography.small.lineHeight};
`
const Divider = styled.div`
    background-color: ${Colors.gray._100};
    height: 1px;
    width: 100%;
    margin: ${Spacing.margin._12} 0;
`

interface AddViewsModalProps {
    isOpen: boolean
    onClose: () => void
}
const AddViewsModal = ({ isOpen, onClose }: AddViewsModalProps) => {
    const { data: supportedViews, temporaryAddOrRemoveViewFunc } = useGetSupportedViews()
    return (
        <GTModal
            isOpen={isOpen}
            title="Add views"
            onClose={onClose}
            leftButtons={<RoundedGeneralButton value="Done" color={Colors.purple._1} onClick={onClose} />}
        >
            <>
                {supportedViews.map((supportedView, index) => (
                    <>
                        <SupportedView key={supportedView.id}>
                            <LeftSide>
                                <Icon source={logos[supportedView.logo]} size="small" />
                                {supportedView.name}
                            </LeftSide>
                            <GTCheckmark
                                isChecked={supportedView.is_added}
                                onChange={() => temporaryAddOrRemoveViewFunc(supportedView.id, !supportedView.is_added)}
                            />
                        </SupportedView>
                        {index !== supportedViews.length - 1 && <Divider />}
                    </>
                ))}
            </>
        </GTModal>
    )
}

export default AddViewsModal
