import {
    Command,
    EditorActions,
    INPUT_METHOD,
    ListState,
    TextFormattingState,
    WithPluginState,
    blockPluginStateKey,
    getListCommands,
    insertBlockType,
    listStateKey,
    textFormattingStateKey,
    toggleCode,
    toggleEm,
    toggleStrike,
    toggleStrong,
    toggleUnderline,
} from '@atlaskit/editor-core'
import { CMD_CTRL, CTRL, SHIFT } from '../../../../constants/shortcuts'
import { icons } from '../../../../styles/images'
import ToolbarButton from '../toolbar/ToolbarButton'
import { Divider, MarginLeftGap, MenuContainer } from '../toolbar/styles'

interface ToolbarProps {
    editorActions: EditorActions
    rightContent?: React.ReactNode
}
const Toolbar = ({ editorActions, rightContent }: ToolbarProps) => {
    return (
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
                            editorActions._privateGetEditorView().state,
                            editorActions._privateGetEditorView().dispatch
                        )
                    }
                }

                const getInsertBlockAction = (blockType: string) => {
                    return () => {
                        const { state, dispatch } = editorActions._privateGetEditorView()
                        insertBlockType(blockType)(state, dispatch)
                    }
                }

                return (
                    <MenuContainer className="toolbar" onMouseDown={(e) => e.preventDefault()}>
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
                                    editorActions._privateGetEditorView(),
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
                                    editorActions._privateGetEditorView(),
                                    INPUT_METHOD.TOOLBAR
                                )
                            }
                            isActive={listState.bulletListActive}
                            shortcutLabel="Bulleted list"
                            shortcut={`${CMD_CTRL.label}+${SHIFT}+8`}
                        />
                        <Divider />
                        <ToolbarButton
                            icon={icons.quote_right}
                            action={getInsertBlockAction('blockquote')}
                            isActive={false}
                            shortcutLabel="Blockquote"
                            shortcut={`${CTRL.label}+>`}
                        />
                        <ToolbarButton
                            icon={icons.code}
                            action={getToggleTextFormattingAction(toggleCode)}
                            isActive={textFormattingState.codeActive}
                            shortcutLabel="Code"
                        />
                        <ToolbarButton
                            icon={icons.code_block}
                            action={getInsertBlockAction('codeblock')}
                            isActive={false}
                            shortcutLabel="Code block"
                        />
                        <MarginLeftGap>{rightContent}</MarginLeftGap>
                    </MenuContainer>
                )
            }}
        />
    )
}

export default Toolbar
