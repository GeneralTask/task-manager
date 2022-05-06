import { TEmail, TRecipients } from "../../../utils/types"

import { EmailComposeType } from "../../../utils/enums"

const prefixes = ['Re: ', 'Fwd: ', 'Fw: ']

export function stripSubjectPrefix(subject: string): string {
    for (const prefix of prefixes) {
        if (subject.startsWith(prefix)) {
            return subject.substring(prefix.length)
        }
    }
    return subject
}

const composeTypeToPrefix = new Map<EmailComposeType | null, string>([
    [EmailComposeType.REPLY, 'Re: '],
    [EmailComposeType.REPLY_ALL, 'Re: '],
    [EmailComposeType.FORWARD, 'Fwd: '],
    [null, ''],
])

export function attachSubjectPrefix(subject: string, composeType: EmailComposeType | null): string {
    const prefix = composeTypeToPrefix.get(composeType)
    return prefix + subject
}

export function getInitialRecipients(email: TEmail, composeType: EmailComposeType | null, exclude: string): TRecipients {
    let initialToRecipients: string[]
    switch (composeType) {
        case EmailComposeType.REPLY:
            initialToRecipients = [email.sender.email]
            break
        case EmailComposeType.REPLY_ALL:
            initialToRecipients = [
                email.sender.email,
                ...email.recipients.to.map(recipient => recipient.email).filter(email => email !== exclude),
                ...email.recipients.cc.map(recipient => recipient.email).filter(email => email !== exclude),
            ]
            break
        default:
            initialToRecipients = []
    }
    console.log({ initialToRecipients, composeType })
    return {
        to: initialToRecipients.map(email => ({ email, name: '' })),
        cc: [],
        bcc: [],
    }
}