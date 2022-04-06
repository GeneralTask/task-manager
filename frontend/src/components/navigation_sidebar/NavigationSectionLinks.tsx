import React from 'react'
import { icons } from '../../styles/images'
import { TTaskSection } from '../../utils/types'
import NavigationLink from './NavigationLink'
import NavigationLinkDropdown from './NavigationLinkDropdown'

interface SectionLinksProps {
    taskSections: TTaskSection[]
    sectionId: string
    pathName: string
}

const NavigationSectionLinks = ({ taskSections, sectionId, pathName }: SectionLinksProps) => {
    return (
        <>
            <NavigationLinkDropdown title={'Tasks'} icon={icons.inbox} link={''} isCurrentPage={false}>
                {taskSections.map((section, index) => (
                    <NavigationLink
                        key={index}
                        link={`/tasks/${section.id}`}
                        title={section.name}
                        icon={icons.label}
                        isCurrentPage={sectionId === section.id}
                        taskSection={section}
                        droppable={!section.is_done}
                    />
                ))}
            </NavigationLinkDropdown>
            <NavigationLink
                link="/messages"
                title="Messages"
                icon={icons.inbox}
                isCurrentPage={pathName === '/messages'}
            />
            <NavigationLink
                link="/settings"
                title="Settings"
                icon={icons.gear}
                isCurrentPage={pathName === '/settings'}
            />
        </>
    )
}

export default NavigationSectionLinks
