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

const composeTypeToPrefix = new Map<EmailComposeType, string>([
    [EmailComposeType.REPLY, 'Re: '],
    [EmailComposeType.REPLY_ALL, 'Re: '],
    [EmailComposeType.FORWARD, 'Fwd: '],
])

export function attachSubjectPrefix(subject: string, composeType: EmailComposeType): string {
    const prefix = composeTypeToPrefix.get(composeType)
    return prefix + subject
}

export function getInitialRecipients(email: TEmail, composeType: EmailComposeType, exclude: string): TRecipients {
    let initialToRecipients: string[] = []
    if (composeType === EmailComposeType.REPLY) {
        initialToRecipients = [email.sender.email]
    }
    else if (composeType === EmailComposeType.REPLY_ALL) {
        initialToRecipients = [
            email.sender.email,
            ...email.recipients.to.map(recipient => recipient.email).filter(email => email !== exclude),
            ...email.recipients.cc.map(recipient => recipient.email).filter(email => email !== exclude),
        ]
    }
    return {
        to: initialToRecipients.map(email => ({ email, name: '' })),
        cc: [],
        bcc: [],
    }
}
