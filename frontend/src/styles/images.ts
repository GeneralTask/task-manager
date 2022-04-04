import { ImageSourcePropType, Platform } from 'react-native'

export const size = {
    logo: {
        header: Platform.OS === 'web' ? '50px' : 50
    }
}

export const logos: { [key: string]: ImageSourcePropType } = {
    generaltask: require('../assets/generaltask.png'),
    generaltask_gray: require('../assets/generaltask_gray.png'),
    asana: require('../assets/asana.png'),
    asana_gray: require('../assets/asana_gray.png'),
    github: require('../assets/github.png'),
    // github_gray: require('../assets/github_gray.png'), TODO: add asset
    gmail: require('../assets/gmail.png'),
    gmail_gray: require('../assets/gmail_gray.png'),
    gcal: require('../assets/gcal.png'),
    gcal_gray: require('../assets/gcal_gray.png'),
    slack: require('../assets/slack.png'),
    // slack_gray: require('../assets/slack_gray.png'), TODO: add asset
}

export const icons: { [key: string]: ImageSourcePropType } = {
    calendar_blank: require('../assets/calendar_blank.png'),
    caret_left: require('../assets/caret_left.png'),
    caret_right: require('../assets/caret_right.png'),
    caret_right_purple: require('../assets/caret_right_purple.png'),
    check_circle_wavy: require('../assets/check_circle_wavy.png'),
    check_gray: require('../assets/check_gray.png'),
    check_unchecked: require('../assets/check_unchecked.png'),
    chevron_up: require('../assets/chevron_up.png'),
    chevron_down: require('../assets/chevron_down.png'),
    gear: require('../assets/gear.png'),
    inbox: require('../assets/inbox.png'),
    label: require('../assets/label.png'),
    mark_as_task: require('../assets/mark_as_task.png'),
    messages: require('../assets/messages.png'),
    plus: require('../assets/plus.png'),
    pencil: require('../assets/pencil.png'),
    spinner: require('../assets/spinner.png'),
    task_complete: require('../assets/task_complete.png'),
    task_incomplete: require('../assets/task_incomplete.png'),
    timer: require('../assets/timer.png'),
    trash: require('../assets/trash.png'),
}

export const buttons: { [key: string]: ImageSourcePropType } = {
    google_sign_in: require('../assets/google_sign_in.png'),
}
