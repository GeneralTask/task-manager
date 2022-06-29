import React from 'react'
import { icons, logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import useGetOverviewViews from './dummydata'
import { EditViewsBlock, EditViewsDeleteButton, ModalHeader, EditViewsContainer, ModalContainer } from './styles'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { useAppDispatch } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import { Colors } from '../../styles'
import { ModalEnum } from '../../utils/enums'
import ModalView from '../views/ModalView'

const EditViewsModal = () => {
    const { data: blocks } = useGetOverviewViews()
    const dispatch = useAppDispatch()
    return (
        <ModalView>
            <ModalContainer>
                <EditViewsContainer>
                    <div>
                        <ModalHeader>Edit Views</ModalHeader>
                        {blocks.map((block) => (
                            <EditViewsBlock key={block.id}>
                                <Icon source={logos[block.logo]} size="small" />
                                {block.name}
                                <EditViewsDeleteButton>
                                    <Icon source={icons.x_thin} size="small" />
                                </EditViewsDeleteButton>
                            </EditViewsBlock>
                        ))}
                    </div>
                    <div>
                        <RoundedGeneralButton
                            value="Done"
                            color={Colors.purple._1}
                            onClick={() => dispatch(setShowModal(ModalEnum.NONE))}
                        />
                    </div>
                </EditViewsContainer>
            </ModalContainer>
        </ModalView>
    )
}

export default EditViewsModal
