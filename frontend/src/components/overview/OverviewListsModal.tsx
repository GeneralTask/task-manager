import { useCallback, useState } from 'react'
import styled from 'styled-components'
import {
    useAddView,
    useGetOverviewViews,
    useGetSupportedViews,
    useRemoveView,
    useReorderViews,
} from '../../services/api/overview.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { DropItem, DropType, TSupportedView, TSupportedViewItem } from '../../utils/types'
import { isGithubLinked } from '../../utils/utils'
import Flex from '../atoms/Flex'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import GTButton from '../atoms/buttons/GTButton'
import GTModal from '../mantine/GTModal'
import { AddListsModalContent } from './AddListsModal'
import EditListsSelectedList from './EditListsSelectedList'

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
                setIsModalOpen={setModalIsOpen}
                title="Overview lists"
                size="lg"
                tabs={[
                    {
                        title: 'Add lists',
                        icon: icons.plus,
                        body: <AddListsModalContent />,
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
