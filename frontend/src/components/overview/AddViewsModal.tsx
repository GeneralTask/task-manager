import React, { Fragment } from 'react'
import styled from 'styled-components'
import { useAddView, useGetSupportedViews, useRemoveView } from '../../services/api/overview.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TSupportedView, TSupportedViewItem } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTCheckbox from '../atoms/GTCheckbox'
import GTModal from '../atoms/GTModal'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import AuthBanner from './AuthBanner'

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
    color: ${Colors.text.black};
    gap: ${Spacing.margin._8};
    ${Typography.bodySmall};
`
interface AddViewsModalProps {
    isOpen: boolean
    onClose: () => void
}

const AddViewsModalContent = () => {
    const { data: supportedViews } = useGetSupportedViews()
    const { mutate: addView } = useAddView()
    const { mutate: removeView } = useRemoveView()

    if (!supportedViews) {
        return <Spinner />
    }

    const onChange = (
        supportedView: TSupportedView,
        viewIndex: number,
        supportedViewItem: TSupportedViewItem,
        viewItemIndex: number
    ) => {
        if (supportedViewItem.is_added && supportedViewItem.view_id) {
            removeView(supportedViewItem.view_id)
        } else {
            addView({
                supportedView,
                supportedViewIndex: viewIndex,
                supportedViewItem,
                supportedViewItemIndex: viewItemIndex,
            })
        }
    }
    return (
        <>
            {supportedViews.map((supportedView, viewIndex) => (
                <Fragment key={viewIndex}>
                    {supportedView.is_linked ? (
                        <SupportedView>
                            <SupportedViewContent>
                                <Icon icon={logos[supportedView.logo]} size="small" />
                                {supportedView.name}
                            </SupportedViewContent>
                            {!supportedView.is_nested && supportedView.views.length === 1 && (
                                <GTCheckbox
                                    isChecked={supportedView.views[0].is_added}
                                    disabled={supportedView.views[0].is_add_disabled}
                                    onChange={() => {
                                        onChange(supportedView, viewIndex, supportedView.views[0], 0)
                                    }}
                                />
                            )}
                        </SupportedView>
                    ) : (
                        <AuthBanner
                            key={supportedView.name}
                            authorizationUrl={supportedView.authorization_url}
                            name={supportedView.name}
                            logo={supportedView.logo}
                            hasBorder={false}
                        />
                    )}
                    {/* Do not show divider if this is the last item in the list */}
                    {((!supportedView.is_nested && viewIndex !== supportedViews.length - 1) ||
                        (supportedView.is_nested && supportedView.views.length > 0)) && (
                        <Divider color={Colors.border.light} />
                    )}
                    {supportedView.is_nested &&
                        supportedView.views.map((supportedViewItem, viewItemIndex) => (
                            <Fragment key={viewItemIndex}>
                                <SupportedView isIndented>
                                    <SupportedViewContent>
                                        <Icon icon={logos[supportedView.logo]} size="small" />
                                        {supportedViewItem.name}
                                    </SupportedViewContent>
                                    <GTCheckbox
                                        isChecked={supportedViewItem.is_added}
                                        disabled={supportedViewItem.is_add_disabled}
                                        onChange={() =>
                                            onChange(supportedView, viewIndex, supportedViewItem, viewItemIndex)
                                        }
                                    />
                                </SupportedView>
                                {(viewIndex !== supportedViews.length - 1 ||
                                    viewItemIndex !== supportedView.views.length - 1) && (
                                    <Divider color={Colors.border.light} />
                                )}
                            </Fragment>
                        ))}
                </Fragment>
            ))}
        </>
    )
}

const AddViewsModal = ({ isOpen, onClose }: AddViewsModalProps) => {
    return (
        <GTModal
            isOpen={isOpen}
            title="Add views"
            onClose={onClose}
            rightButtons={<GTButton value="Done" styleType="primary" onClick={onClose} />}
            type="medium"
        >
            <AddViewsModalContent />
        </GTModal>
    )
}

export default AddViewsModal
