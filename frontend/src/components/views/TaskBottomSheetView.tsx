import React, { forwardRef, useRef, useState } from 'react'
import { Dimensions } from 'react-native'
import BottomSheet from 'reanimated-bottom-sheet'
import { useGetTasks, useModifyTask } from '../../services/api-query-hooks'
import { getTaskById } from '../../utils/task'
import EditSheet from '../molecules/EditSheet'

interface TaskBottomSheetProps {
    sheetTaskId: string
    setSheetTaskId: (id: string) => void
}
const TaskBottomSheet = forwardRef(
    ({ sheetTaskId, setSheetTaskId }: TaskBottomSheetProps, sheetRef: React.Ref<BottomSheet>) => {
        const { data: taskSections } = useGetTasks()
        const [text, setText] = useState('')
        const currTaskIdRef = useRef('')
        const { mutate: modifyTask } = useModifyTask()

        const renderContent = () => {
            if (!taskSections) return
            const task = getTaskById(taskSections, sheetTaskId)
            if (!task) return
            currTaskIdRef.current = task.id
            return <EditSheet setText={setText} task={task} />
        }

        return (
            <BottomSheet
                initialSnap={1}
                ref={sheetRef}
                snapPoints={[Dimensions.get('window').height - 100, 0]}
                borderRadius={10}
                renderContent={renderContent}
                onCloseEnd={() => {
                    modifyTask({
                        id: currTaskIdRef.current,
                        body: text,
                    })
                    currTaskIdRef.current = ''
                    setSheetTaskId('')
                }}
            />
        )
    }
)

export default TaskBottomSheet
