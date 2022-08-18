import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing } from '../../styles'
import GTButton from '../atoms/buttons/GTButton'
import GTModal from '../atoms/GTModal'
import GTSelect from '../molecules/GTSelect'
import CalendarView from '../views/CalendarView'
import TaskList from '../views/TaskListView'

interface CalendarTriageModalProps {
    isOpen: boolean
    onClose: () => void
}

const TriageLeftContainer = styled.div`
    flex: 1 0 0;
    overflow-y: scroll;
    border: 4px solid ${Colors.background.dark};
    border-radius: ${Border.radius.small};
    background-color: ${Colors.gtColor.secondary};
`

const TriageRightContainer = styled.div`
    flex: 3 0 0;
    background-color: ${Colors.background.dark};
    padding: ${Spacing.padding._4};
    border-radius: ${Border.radius.small};
    box-size: border-box;
`

const CalendarTriageContainer = styled.div`
    display: flex;
    justify-content: space-between;
    height: 100%;
    flex-direction: row;
    overflow: hidden;
    gap: ${Spacing.margin._4};
    padding-bottom: ${Spacing.padding._8};
`

const CalendarTriageModal = ({ isOpen, onClose }: CalendarTriageModalProps) => {
    const [showTaskSectionsDropdown, setShowTaskSectionsDropdown] = useState(false)
    const { section: sectionId } = useParams()
    const { data: taskSections } = useGetTasks()
    const [isExpanded, setIsExpanded] = useState(true)
    const [sectionState, setSectionState] = useState(sectionId)
    useEffect(() => {
        setSectionState(sectionId)
    }, [sectionId])
    const section = taskSections?.filter(({ name }) => name !== 'Done').find(({ id }) => id === sectionState)
    if (!section) return null

    return (
        <GTModal
            isOpen={isOpen}
            title="Schedule Tasks"
            onClose={onClose}
            rightButtons={<GTButton value="Done" styleType="primary" onClick={onClose} />}
            type="large"
        >
            <CalendarTriageContainer>
                <TriageLeftContainer>
                    <div style={{ height: '50px', position: 'relative' }}>
                        <GTButton
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowTaskSectionsDropdown(!showTaskSectionsDropdown)
                            }}
                            fitContent={false}
                            value={section.name}
                            styleType="primary"
                        />
                    </div>
                    {showTaskSectionsDropdown && (
                        <GTSelect
                            options={
                                taskSections
                                    ?.filter(({ name }) => name !== 'Done' && name !== section.name)
                                    .map((currSection) => ({
                                        item: <div>{currSection.name}</div>,
                                        onClick: () => {
                                            setSectionState(currSection.id)
                                        },
                                        hasPadding: true,
                                    })) ?? []
                            }
                            location="left"
                            onClose={() => setShowTaskSectionsDropdown(false)}
                            // parentRef={}
                        />
                    )}
                    <TaskList section={section!} allowSelect={false} />
                </TriageLeftContainer>
                <TriageRightContainer>
                    <CalendarView
                        isExpanded={isExpanded}
                        setIsExpanded={setIsExpanded}
                        showExpandOptions={false}
                        hasRoundedBorder
                    />
                </TriageRightContainer>
            </CalendarTriageContainer>
        </GTModal>
    )
}

export default CalendarTriageModal
