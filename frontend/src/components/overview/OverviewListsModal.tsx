import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useGTLocalStorage, usePreviewMode } from '../../hooks'
import { useGetOverviewViews, useReorderViews } from '../../services/api/overview.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { DropItem, DropType } from '../../utils/types'
import Flex from '../atoms/Flex'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import { Body } from '../atoms/typography/Typography'
import GTModal from '../mantine/GTModal'
import { AddListsModalContent } from './AddListsModal'
import EditListsSelectedList from './EditListsSelectedList'
import ListModalPreference from './ListModalPreference'

const PositionedDivider = styled(Divider)`
    margin-top: ${Spacing._24};
`
const PreferencesContainer = styled.div`
    margin-top: ${Spacing._16};
    margin-left: ${Spacing._16};
`
const PreferencesTitle = styled(Body)`
    ${Typography.bold}
`

const OverviewListsModal = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const { data: views } = useGetOverviewViews()
    const { mutate: reorderViews } = useReorderViews()
    const [automaticSortEmpty, setAutomaticSortEmpty] = useGTLocalStorage('overviewAutomaticEmptySort', false, true)
    const { isPreviewMode } = usePreviewMode()

    const handleReorder = useCallback(
        (item: DropItem, dropIndex: number) =>
            reorderViews({ id: item.id, idOrdering: dropIndex }, item.view?.optimisticId),
        [reorderViews]
    )

    return (
        <>
            <GTButton
                value="Edit lists"
                styleType="simple"
                size="small"
                icon={icons.gear}
                iconColor="gray"
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
                                {isPreviewMode && (
                                    <>
                                        <PositionedDivider color={Colors.border.light} />
                                        <PreferencesContainer>
                                            <PreferencesTitle>Preferences</PreferencesTitle>
                                            <ListModalPreference
                                                text="Move empty or completed lists to the bottom of Daily Overview"
                                                subtext="Once a list that was previously empty or completed is filled
                    with items again, it will return to its original position."
                                                onClick={() => setAutomaticSortEmpty(!automaticSortEmpty)}
                                                isChecked={automaticSortEmpty}
                                            />
                                        </PreferencesContainer>
                                    </>
                                )}
                            </Flex>
                        ),
                    },
                ]}
            />
        </>
    )
}

export default OverviewListsModal
