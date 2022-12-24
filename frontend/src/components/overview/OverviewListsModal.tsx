import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useGTLocalStorage, usePreviewMode } from '../../hooks'
import { useGetOverviewViews, useReorderViews } from '../../services/api/overview.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { DropItem, DropType } from '../../utils/types'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import { Body, Label, Mini } from '../atoms/typography/Typography'
import GTModal from '../mantine/GTModal'
import { AddListsModalContent } from './AddListsModal'
import EditListsSelectedList from './EditListsSelectedList'

const PositionedDivider = styled(Divider)`
    margin-top: ${Spacing._24};
`
const PreferencesContainer = styled.div`
    margin-top: ${Spacing._16};
    margin-left: ${Spacing._16};
`
const Preference = styled.div`
    margin-top: ${Spacing._16};
    display: flex;
    gap: ${Spacing._16};
`
const PreferencesTitle = styled(Body)`
    ${Typography.bold}
`
const PreferenceDescription = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
`
const StyledMini = styled(Mini)`
    padding-top: ${Spacing._4};
    color: ${Colors.text.light};
    cursor: pointer;
    width: fit-content;
    user-select: none;
`
const StyledLabel = styled(Label)`
    width: fit-content;
    cursor: pointer;
    user-select: none;
`
const CursorPointer = styled.div`
    cursor: pointer;
    height: fit-content;
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
                                            <Preference>
                                                <CursorPointer
                                                    onClick={() => setAutomaticSortEmpty(!automaticSortEmpty)}
                                                >
                                                    <Icon
                                                        icon={
                                                            automaticSortEmpty
                                                                ? icons.checkbox_checked_solid
                                                                : icons.checkbox_unchecked
                                                        }
                                                        color="purple"
                                                    />
                                                </CursorPointer>
                                                <PreferenceDescription>
                                                    <StyledLabel
                                                        onClick={() => setAutomaticSortEmpty(!automaticSortEmpty)}
                                                    >
                                                        Move empty or completed lists to the bottom of Daily Overview
                                                    </StyledLabel>
                                                    <StyledMini
                                                        onClick={() => setAutomaticSortEmpty(!automaticSortEmpty)}
                                                    >
                                                        Once a list that was previously empty or completed is filled
                                                        with items again, it will return to its original position.
                                                    </StyledMini>
                                                </PreferenceDescription>
                                            </Preference>
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
