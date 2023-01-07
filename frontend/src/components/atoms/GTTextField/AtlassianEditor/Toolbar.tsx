import {
    Command,
    INPUT_METHOD,
    ListState,
    TextFormattingState,
    WithEditorActions,
    WithPluginState,
    blockPluginStateKey,
    getListCommands,
    listStateKey,
    textFormattingStateKey,
    toggleCode,
    toggleEm,
    toggleStrike,
    toggleStrong,
    toggleUnderline,
} from '@atlaskit/editor-core'
import styled from 'styled-components'
import { CMD_CTRL, SHIFT } from '../../../../constants/shortcuts'
import { Border, Colors, Spacing } from '../../../../styles'
import { icons } from '../../../../styles/images'
import ToolbarButton from '../MarkdownEditor/ToolbarButton'

const MenuContainer = styled.div`
    display: flex;
    align-items: center;
    background-color: ${Colors.background.medium};
    padding: ${Spacing._4} ${Spacing._8};
    border-bottom-left-radius: ${Border.radius.small};
    border-bottom-right-radius: ${Border.radius.small};
    gap: ${Spacing._8};
    bottom: 0;
    left: 0;
    right: 0;
    overflow-x: auto;
`
const Divider = styled.div`
    border: ${Border.stroke.medium} solid ${Colors.border.light};
    height: ${Spacing._16};
`
const MarginLeftGap = styled.div`
    margin-left: auto !important;
    gap: ${Spacing._8};
`

interface ToolbarProps {
    rightContent?: React.ReactNode
}
const Toolbar = ({ rightContent }: ToolbarProps) => {
    return (
        <WithEditorActions
            render={(actions) => (
                <WithPluginState
                    plugins={{
                        textFormattingState: textFormattingStateKey,
                        listState: listStateKey,
                        blockState: blockPluginStateKey,
                    }}
                    render={(pluginState) => {
                        const textFormattingState = pluginState.textFormattingState as TextFormattingState
                        const listState = pluginState.listState as ListState

                        if (!textFormattingState || !listState) return null

                        const getToggleTextFormattingAction = (toggleFunc: () => Command) => {
                            return () => {
                                toggleFunc()(
                                    actions._privateGetEditorView().state,
                                    actions._privateGetEditorView().dispatch
                                )
                            }
                        }

                        return (
                            <MenuContainer onMouseDown={(e) => e.preventDefault()}>
                                <ToolbarButton
                                    icon={icons.bold}
                                    action={getToggleTextFormattingAction(toggleStrong)}
                                    isActive={textFormattingState.strongActive}
                                    shortcutLabel="Bold"
                                    shortcut={`${CMD_CTRL.label}+B`}
                                />
                                <ToolbarButton
                                    icon={icons.italic}
                                    action={getToggleTextFormattingAction(toggleEm)}
                                    isActive={textFormattingState.emActive}
                                    shortcutLabel="Italic"
                                    shortcut={`${CMD_CTRL.label}+I`}
                                />
                                <ToolbarButton
                                    icon={icons.underline}
                                    action={getToggleTextFormattingAction(toggleUnderline)}
                                    isActive={textFormattingState.underlineActive}
                                    shortcutLabel="Underline"
                                    shortcut={`${CMD_CTRL.label}+U`}
                                />
                                <ToolbarButton
                                    icon={icons.strikethrough}
                                    action={getToggleTextFormattingAction(toggleStrike)}
                                    isActive={textFormattingState.strikeActive}
                                    shortcutLabel="Strikethrough"
                                    shortcut={`${CMD_CTRL.label}+D`}
                                />
                                <Divider />
                                {/* TODO: will add this back with full link functionality */}
                                {/* <ToolbarButton icon={icons.link} action={emptyFunction} isActive={active.link()} title="Add link" /> */}
                                {/* <Divider /> */}
                                <ToolbarButton
                                    icon={icons.list_ol}
                                    action={() =>
                                        getListCommands().toggleOrderedList(
                                            actions._privateGetEditorView(),
                                            INPUT_METHOD.TOOLBAR
                                        )
                                    }
                                    isActive={listState.orderedListActive}
                                    shortcutLabel="Ordered list"
                                    shortcut={`${CMD_CTRL.label}+${SHIFT}+9`}
                                />
                                <ToolbarButton
                                    icon={icons.list_ul}
                                    action={() =>
                                        getListCommands().toggleBulletList(
                                            actions._privateGetEditorView(),
                                            INPUT_METHOD.TOOLBAR
                                        )
                                    }
                                    isActive={listState.bulletListActive}
                                    shortcutLabel="Bulleted list"
                                    shortcut={`${CMD_CTRL.label}+${SHIFT}+8`}
                                />
                                <Divider />
                                {/* TODO: add blockquote */}
                                {/* <ToolbarButton
                                    icon={icons.quote_right}
                                    action={q}
                                    isActive={}
                                    shortcutLabel="Blockquote"
                                    shortcut={`${CTRL.label}+>`}
                                /> */}
                                <ToolbarButton
                                    icon={icons.code}
                                    action={getToggleTextFormattingAction(toggleCode)}
                                    isActive={textFormattingState.codeActive}
                                    shortcutLabel="Code"
                                />
                                {/* TODO: add code block */}
                                {/* <ToolbarButton
                                    icon={icons.code_block}
                                    action={commands.toggleCodeBlock}
                                    isActive={active.codeBlock()}
                                    shortcutLabel="Code block"
                                /> */}
                                <MarginLeftGap>{rightContent}</MarginLeftGap>
                            </MenuContainer>
                        )
                    }}
                />
            )}
        />
    )
}

export default Toolbar
