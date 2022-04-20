import { Border, Colors } from '../../styles'
import React, { useState } from 'react'
import { margin, padding } from '../../styles/spacing'
import { useAddTaskSection, useGetTasks } from '../../services/api-query-hooks'
import { useLocation, useParams } from 'react-router-dom'

import FeedbackButton from '../molecules/FeedbackButton'
import { Icon, Loading } from '@atoms'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'
import { NoStyleInput } from '@atoms'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { authSignOut } from '../../utils/auth'
import { icons } from '../../styles/images'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { weight } from '../../styles/typography'

const NavigationViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 232px;
    background-color: ${Colors.gray._100};
    padding: ${padding._8}px;
    box-sizing: border-box;
`
const NavigationViewHeader = styled.div`
    flex-basis: 24px;
    width: 100%;
    margin-bottom: ${margin._16}px;
`
const OverflowContainer = styled.div`
    flex: 1;
    overflow: auto;
`
const AddSectionView = styled.div`
    display: flex;
    flex-direction: row;
    padding: ${padding._4}px ${padding._8}px;
    border-radius: ${Border.radius.small};
    border-width: 2px;
    border-style: solid;
    border-color: transparent;
    align-items: center;
`
const AddSectionInputView = styled.div`
    font-weight: ${weight._600};
    margin-left: ${margin._8}px;
    flex: 1;
`
const GapView = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${margin._8}px;
    padding-bottom: ${padding._8}px;
    margin-top: auto;
`

const NavigationView = () => {
    const dispatch = useAppDispatch()
    const { data: taskSections } = useGetTasks()
    const { section: sectionIdParam } = useParams()
    const [sectionName, setSectionName] = useState('')
    const { mutate: addTaskSection } = useAddTaskSection()
    const { pathname } = useLocation()

    return (
        <NavigationViewContainer>
            <NavigationViewHeader>
                <Icon size="medium" />
            </NavigationViewHeader>
            <OverflowContainer>
                {taskSections ? (
                    <NavigationSectionLinks
                        taskSections={taskSections}
                        sectionId={sectionIdParam || ''}
                        pathName={pathname.split('/')[1]}
                    />
                ) : (
                    <Loading />
                )}
                <AddSectionView>
                    <Icon size="small" source={icons.plus} />
                    <AddSectionInputView>
                        <NoStyleInput
                            value={sectionName}
                            onChange={(e) => setSectionName(e.target.value)}
                            placeholder={'Add Section'}
                            onSubmit={() => {
                                setSectionName('')
                                addTaskSection({ name: sectionName })
                            }}
                        />
                    </AddSectionInputView>
                </AddSectionView>
            </OverflowContainer>
            <GapView>
                <FeedbackButton />
                <RoundedGeneralButton value="Sign Out" textStyle="dark" onPress={() => authSignOut(dispatch)} />
            </GapView>
        </NavigationViewContainer>
    )
}

export default NavigationView
