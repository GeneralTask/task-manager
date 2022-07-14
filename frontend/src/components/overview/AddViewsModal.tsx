import React, { Fragment } from 'react'
import styled from 'styled-components'
import { useAddView, useGetSupportedViews } from '../../services/api/overview.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TSupportedView, TSupportedViewItem } from '../../utils/types'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import GTCheckbox from '../atoms/GTCheckbox'
import GTModal from '../atoms/GTModal'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'

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

const AddViewsModalContent = () => {
    const { data: supportedViews } = useGetSupportedViews()
    const { mutate: addView } = useAddView()

    const handleAddRemoveView = (
        supportedView: TSupportedView,
        supportedViewItem: TSupportedViewItem,
        isAdded: boolean
    ) => {
        if (isAdded) {
            addView({
                type: supportedView.type,
                logo: supportedView.logo,
                supportedViewItem,
            })
        }
    }

    if (!supportedViews) {
        return <Spinner />
    }
    return (
        <>
            {supportedViews.map((supportedView, index) => (
                <Fragment key={index}>
                    <SupportedView key={index}>
                        <SupportedViewContent>
                            <Icon source={logos[supportedView.logo]} size="small" />
                            {supportedView.type}
                        </SupportedViewContent>
                        {supportedView.views.map((supportedViewItem, index) => (
                            <SupportedView key={index}>
                                <SupportedViewContent>
                                    <Icon source={logos[supportedView.logo]} size="small" />
                                    {supportedViewItem.name}
                                </SupportedViewContent>
                                <GTCheckbox
                                    isChecked={false}
                                    onChange={() => handleAddRemoveView(supportedView, supportedViewItem, true)}
                                />
                            </SupportedView>
                        ))}
                    </SupportedView>
                    {index !== supportedViews.length - 1 && <Divider color={Colors.gray._100} />}
                </Fragment>
            ))}
        </>
    )
}

const AddViewsModal = ({ isOpen, onClose, goToEditViewsView }: AddViewsModalProps) => {
    return (
        <GTModal
            isOpen={isOpen}
            title="Add views"
            onClose={onClose}
            leftButtons={<RoundedGeneralButton value="Back" color={Colors.purple._1} onClick={goToEditViewsView} />}
        >
            <AddViewsModalContent />
        </GTModal>
    )
}

export default AddViewsModal
