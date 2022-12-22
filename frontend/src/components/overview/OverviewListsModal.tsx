import { useCallback, useState } from 'react'
import { useGetOverviewViews, useReorderViews } from '../../services/api/overview.hooks'
import { icons } from '../../styles/images'
import { DropItem, DropType } from '../../utils/types'
import Flex from '../atoms/Flex'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import GTButton from '../atoms/buttons/GTButton'
import GTModal from '../mantine/GTModal'
import { AddListsModalContent } from './AddListsModal'
import EditListsSelectedList from './EditListsSelectedList'

const OverviewListsModal = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const { data: views } = useGetOverviewViews()
    const { mutate: reorderViews } = useReorderViews()

    const handleReorder = useCallback(
        (item: DropItem, dropIndex: number) =>
            reorderViews({ id: item.id, idOrdering: dropIndex }, item.view?.optimisticId),
        [reorderViews]
    )

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
                size="lg"
                tabs={[
                    {
                        title: 'Add lists',
                        icon: icons.plus,
                        body: <AddListsModalContent />,
                    },
                    {
                        title: 'List order',
                        icon: icons.sortArrows,
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
