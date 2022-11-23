import { Fragment, useDeferredValue, useMemo, useState } from 'react'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { GITHUB_SUPPORTED_VIEW_NAME } from '../../constants'
import { usePreviewMode } from '../../hooks'
import { useAddView, useGetSupportedViews, useRemoveView } from '../../services/api/overview.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TSupportedView, TSupportedViewItem } from '../../utils/types'
import { isGithubLinked } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTCheckbox from '../atoms/GTCheckbox'
import GTInput from '../atoms/GTInput'
import GTModal from '../atoms/GTModal'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import AuthBanner from './AuthBanner'
import MissingRepositoryMessage from './MissingRepositoryMessage'

const SupportedView = styled.div<{ isIndented?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing._8};
    ${(props) => props.isIndented && `padding-left: ${Spacing._32}`}
`
const SupportedViewContent = styled.div`
    display: flex;
    align-items: center;
    color: ${Colors.text.black};
    gap: ${Spacing._8};
    ${Typography.bodySmall};
`
const NoListsDialog = styled.div`
    display: flex;
    justify-content: center;
    ${Typography.body};
    margin-top: ${Spacing._8};
`

interface AddListsModalProps {
    isOpen: boolean
    onClose: () => void
}

export const AddListsModalContent = () => {
    const { data: supportedViews } = useGetSupportedViews()
    const { mutate: addView } = useAddView()
    const { mutate: removeView } = useRemoveView()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const { isPreviewMode } = usePreviewMode()

    const isGithubIntegrationLinked = isGithubLinked(linkedAccounts ?? [])

    const [searchTerm, setSearchTerm] = useState('')
    const deferredSearchTerm = useDeferredValue(searchTerm)

    const filteredSupportedViews = useMemo(() => {
        const lowercaseSearchTerm = deferredSearchTerm.toLowerCase()
        if (!lowercaseSearchTerm || !isPreviewMode || !supportedViews) {
            return supportedViews
        }
        const filtered: TSupportedView[] = []
        for (const view of supportedViews) {
            if (view.is_nested) {
                const filteredNestedViews = view.views.filter((nestedView) =>
                    nestedView.name.toLowerCase().includes(lowercaseSearchTerm)
                )
                if (filteredNestedViews.length > 0) {
                    filtered.push({ ...view, views: filteredNestedViews })
                }
            } else {
                if (view.name.toLowerCase().includes(lowercaseSearchTerm)) {
                    filtered.push(view)
                }
            }
        }
        return filtered
    }, [supportedViews, deferredSearchTerm])

    const onChange = (
        supportedView: TSupportedView,
        viewIndex: number,
        supportedViewItem: TSupportedViewItem,
        viewItemIndex: number
    ) => {
        if (supportedViewItem.is_added && supportedViewItem.view_id) {
            removeView({ id: supportedViewItem.view_id }, supportedViewItem.optimisticId)
        } else {
            addView({
                optimisticId: uuidv4(),
                supportedView,
                supportedViewIndex: viewIndex,
                supportedViewItem,
                supportedViewItemIndex: viewItemIndex,
            })
        }
    }

    if (!filteredSupportedViews) {
        return <Spinner />
    }
    return (
        <>
            {isPreviewMode && (
                <Flex alignItems="center">
                    {/* TODO: use our actual magnifiying glass icon - not implemented because our input component doesnt support jsx/icons in the placeholder prop */}
                    <GTInput
                        value={searchTerm}
                        onChange={(value: string) => setSearchTerm(value)}
                        placeholder=" 🔍 Search lists"
                    />
                </Flex>
            )}
            {filteredSupportedViews.length === 0 && <NoListsDialog>No lists matching your query</NoListsDialog>}
            {filteredSupportedViews.map((supportedView, viewIndex) => (
                <Fragment key={viewIndex}>
                    {supportedView.is_linked ? (
                        <SupportedView>
                            <SupportedViewContent>
                                <Icon icon={logos[supportedView.logo]} />
                                {supportedView.name}
                            </SupportedViewContent>
                            {!supportedView.is_nested && supportedView.views.length === 1 && (
                                <GTCheckbox
                                    isChecked={supportedView.views[0].is_added}
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
                    {((!supportedView.is_nested && viewIndex !== filteredSupportedViews.length - 1) ||
                        (supportedView.is_nested && supportedView.views.length > 0)) && (
                        <Divider color={Colors.border.light} />
                    )}
                    {supportedView.is_nested &&
                        supportedView.views.map((supportedViewItem, viewItemIndex) => (
                            <Fragment key={viewItemIndex}>
                                <SupportedView isIndented>
                                    <SupportedViewContent>
                                        <Icon icon={logos[supportedView.logo]} />
                                        {supportedViewItem.name}
                                    </SupportedViewContent>
                                    <GTCheckbox
                                        isChecked={supportedViewItem.is_added}
                                        onChange={() =>
                                            onChange(supportedView, viewIndex, supportedViewItem, viewItemIndex)
                                        }
                                    />
                                </SupportedView>
                                {(viewIndex !== filteredSupportedViews.length - 1 ||
                                    viewItemIndex !== supportedView.views.length - 1) && (
                                    <Divider color={Colors.border.light} />
                                )}
                            </Fragment>
                        ))}
                    {supportedView.name === GITHUB_SUPPORTED_VIEW_NAME && isGithubIntegrationLinked && (
                        <MissingRepositoryMessage />
                    )}
                </Fragment>
            ))}
        </>
    )
}

const AddListsModal = ({ isOpen, onClose }: AddListsModalProps) => {
    return (
        <GTModal
            isOpen={isOpen}
            title="Add lists"
            onClose={onClose}
            rightButtons={<GTButton value="Done" styleType="primary" onClick={onClose} />}
            type="medium"
        >
            <AddListsModalContent />
        </GTModal>
    )
}

export default AddListsModal
