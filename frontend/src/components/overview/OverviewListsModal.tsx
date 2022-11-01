import { Fragment, useCallback, useState } from 'react'
import styled from 'styled-components'
import { GITHUB_SUPPORTED_VIEW_NAME } from '../../constants'
import {
    useAddView,
    useGetOverviewViews,
    useGetSupportedViews,
    useRemoveView,
    useReorderViews,
} from '../../services/api/overview.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { DropItem, DropType, TSupportedView, TSupportedViewItem } from '../../utils/types'
import { isGithubLinked } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTCheckbox from '../atoms/GTCheckbox'
import { Icon } from '../atoms/Icon'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import GTModal from '../mantine/GTModal'
import AuthBanner from './AuthBanner'
import EditListsSelectedList from './EditListsSelectedList'
import MissingRepositoryMessage from './MissingRepositoryMessage'

const SupportedView = styled(Flex)<{ isIndented?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing._8};
    ${(props) => props.isIndented && `padding-left: ${Spacing._32}`}
`
const SupportedViewContent = styled(Flex)`
    display: flex;
    align-items: center;
    color: ${Colors.text.black};
    gap: ${Spacing._8};
    ${Typography.bodySmall};
`

const OverviewListsModal = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const { data: supportedViews } = useGetSupportedViews()
    const { mutate: addView } = useAddView()
    const { mutate: removeView } = useRemoveView()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const isGithubIntegrationLinked = isGithubLinked(linkedAccounts ?? [])

    const { data: views } = useGetOverviewViews()
    const { mutate: reorderViews } = useReorderViews()

    const handleReorder = useCallback(
        (item: DropItem, dropIndex: number) => reorderViews({ viewId: item.id, idOrdering: dropIndex }),
        [reorderViews]
    )

    const onChangeSupportedView = (
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
            <GTButton
                value="Edit"
                styleType="secondary"
                size="small"
                icon={icons.pencil}
                onClick={() => setModalIsOpen(true)}
            />
            <GTModal
                open={modalIsOpen}
                setOpen={setModalIsOpen}
                title="Overview"
                tabs={[
                    {
                        title: 'Add lists',
                        icon: icons.plus,
                        body: (
                            <div>
                                {supportedViews?.map((supportedView, viewIndex) => (
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
                                                        disabled={supportedView.views[0].is_add_disabled}
                                                        onChange={() => {
                                                            onChangeSupportedView(
                                                                supportedView,
                                                                viewIndex,
                                                                supportedView.views[0],
                                                                0
                                                            )
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
                                                            <Icon icon={logos[supportedView.logo]} />
                                                            {supportedViewItem.name}
                                                        </SupportedViewContent>
                                                        <GTCheckbox
                                                            isChecked={supportedViewItem.is_added}
                                                            disabled={supportedViewItem.is_add_disabled}
                                                            onChange={() =>
                                                                onChangeSupportedView(
                                                                    supportedView,
                                                                    viewIndex,
                                                                    supportedViewItem,
                                                                    viewItemIndex
                                                                )
                                                            }
                                                        />
                                                    </SupportedView>
                                                    {(viewIndex !== supportedViews.length - 1 ||
                                                        viewItemIndex !== supportedView.views.length - 1) && (
                                                        <Divider color={Colors.border.light} />
                                                    )}
                                                </Fragment>
                                            ))}
                                        {supportedView.name === GITHUB_SUPPORTED_VIEW_NAME &&
                                            isGithubIntegrationLinked && <MissingRepositoryMessage />}
                                    </Fragment>
                                ))}
                            </div>
                        ),
                    },
                    {
                        title: 'Edit lists',
                        icon: icons.domino,
                        body: (
                            <Flex column flex="1">
                                {views?.map((view, index) => (
                                    <EditListsSelectedList
                                        key={view.id}
                                        view={view}
                                        viewIndex={index}
                                        onReorder={handleReorder}
                                    />
                                ))}
                                <ReorderDropContainer
                                    index={views?.length ?? 0}
                                    acceptDropType={DropType.OVERVIEW_VIEW}
                                    onReorder={handleReorder}
                                    indicatorType="TOP_ONLY"
                                />
                            </Flex>
                        ),
                    },
                ]}
            />
        </>
    )
}

export default OverviewListsModal
