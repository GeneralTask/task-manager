import React, { Fragment } from 'react'
import styled from 'styled-components'
import { useGetSupportedViews } from '../../services/api/overview.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import GTCheckbox from '../atoms/GTCheckbox'
import GTModal from '../atoms/GTModal'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'

const SupportedView = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing.padding._8};
`
const SupportedViewContent = styled.div`
    display: flex;
    align-items: center;
    color: ${Colors.gray._600};
    gap: ${Spacing.margin._8};
    font-size: ${Typography.small.fontSize};
    line-height: ${Typography.small.lineHeight};
`
interface AddViewsModalProps {
    isOpen: boolean
    onClose: () => void
    goToEditViewsView: () => void
}
const AddViewsModal = ({ isOpen, onClose, goToEditViewsView }: AddViewsModalProps) => {
    const { data: supportedViews, temporaryAddOrRemoveViewFunc } = useGetSupportedViews()
    return (
        <GTModal
            isOpen={isOpen}
            title="Add views"
            onClose={onClose}
            leftButtons={<RoundedGeneralButton value="Back" color={Colors.purple._1} onClick={goToEditViewsView} />}
        >
            <>
                {supportedViews.map((supportedView, index) => (
                    <Fragment key={supportedView.id}>
                        <SupportedView>
                            <SupportedViewContent>
                                <Icon source={logos[supportedView.logo]} size="small" />
                                {supportedView.name}
                            </SupportedViewContent>
                            <GTCheckbox
                                isChecked={supportedView.is_added}
                                onChange={() => temporaryAddOrRemoveViewFunc(supportedView.id, !supportedView.is_added)}
                            />
                        </SupportedView>
                        {index !== supportedViews.length - 1 && <Divider color={Colors.gray._100} />}
                    </Fragment>
                ))}
            </>
        </GTModal>
    )
}

export default AddViewsModal
