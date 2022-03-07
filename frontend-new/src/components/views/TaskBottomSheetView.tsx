import React, { forwardRef, useState, useRef } from 'react'
import { Dimensions } from 'react-native'
import { useGetTasksQuery, useModifyTaskMutation } from '../../services/generalTaskApi'
import { getTaskById } from '../../utils/task'
import BottomSheet from 'reanimated-bottom-sheet'
import EditSheet from '../molecules/EditSheet'

interface TaskBottomSheetProps {
    sheetTaskId: string,
    setSheetTaskId: (id: string) => void
}
const TaskBottomSheet = forwardRef(({ sheetTaskId, setSheetTaskId }: TaskBottomSheetProps, sheetRef: React.Ref<BottomSheet>) => {
    const { data: taskSections } = useGetTasksQuery()
    const [text, setText] = useState('')
    const currTaskIdRef = useRef('')
    const [modifyTask] = useModifyTaskMutation()

    const renderContent = () => {
        if (!taskSections) return
        const task = getTaskById(taskSections, sheetTaskId)
        if (!task) return
        currTaskIdRef.current = task.id
        return <EditSheet setText={setText} task={task} />
    }

    return (<BottomSheet
        initialSnap={1}
        ref={sheetRef}
        snapPoints={[Dimensions.get('window').height - 100, 0]}
        borderRadius={10}
        renderContent={renderContent}
        onCloseEnd={() => {
            modifyTask({
                id: currTaskIdRef.current,
                body: text
            })
            currTaskIdRef.current = ''
            setSheetTaskId('')
        }}
    />)
})

export default TaskBottomSheet
