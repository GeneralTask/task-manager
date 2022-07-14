import React, { Fragment } from 'react'
import styled from 'styled-components'
import { useGetSupportedViews } from '../../services/api/overview.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { emptyFunction } from '../../utils/utils'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import GTCheckbox from '../atoms/GTCheckbox'
import GTModal from '../atoms/GTModal'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'

const SupportedView = styled.div<{ isIndented?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing.padding._8};
    ${(props) => props.isIndented && `padding-left: ${Spacing.padding._40}`}
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

    if (!supportedViews) {
        return <Spinner />
    }
    return (
        <>
            {supportedViews.map((supportedView, viewIndex) => (
                <Fragment key={viewIndex}>
                    <SupportedView>
                        <SupportedViewContent>
                            <Icon source={logos[supportedView.logo]} size="small" />
                            {supportedView.name}
                        </SupportedViewContent>
                        {!supportedView.is_nested && supportedView.views.length === 1 && (
                            <GTCheckbox isChecked={supportedView.views[0].is_added} onChange={emptyFunction} />
                        )}
                    </SupportedView>
                    {/* Do not show divider if this is the last item in the list */}
                    {((!supportedView.is_nested && viewIndex !== supportedViews.length - 1) ||
                        (supportedView.is_nested && supportedView.views.length > 0)) && (
                        <Divider color={Colors.gray._100} />
                    )}
                    {supportedView.is_nested &&
                        supportedView.views.map((supportedViewItem, viewItemIndex) => (
                            <Fragment key={viewItemIndex}>
                                <SupportedView isIndented>
                                    <SupportedViewContent>
                                        <Icon source={logos[supportedView.logo]} size="small" />
                                        {supportedViewItem.name}
                                    </SupportedViewContent>
                                    <GTCheckbox isChecked={supportedViewItem.is_added} onChange={emptyFunction} />
                                </SupportedView>
                                {(viewIndex !== supportedViews.length - 1 ||
                                    viewItemIndex !== supportedView.views.length - 1) && (
                                    <Divider color={Colors.gray._100} />
                                )}
                            </Fragment>
                        ))}
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
