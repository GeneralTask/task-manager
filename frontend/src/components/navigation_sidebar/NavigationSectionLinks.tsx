import React from 'react'
import { icons } from '../../styles/images'
import { TTaskSection } from '../../utils/types'
import NavigationLink from './NavigationLink'

interface SectionLinksProps {
    taskSections: TTaskSection[]
    sectionId: string
    pathName: string
}

const NavigationSectionLinks = ({ taskSections, sectionId, pathName }: SectionLinksProps) => {
    return (
        <>
            {taskSections.map((section, index) => (
                <NavigationLink
                    key={index}
                    link={`/tasks/${section.id}`}
                    title={section.name}
                    icon={icons.inbox}
                    isCurrentPage={sectionId === section.id}
                    taskSection={section}
                    droppable={!section.is_done}
                />
            ))}
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
