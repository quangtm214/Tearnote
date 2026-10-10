import type { Lang } from './index';
import type { Dictionary } from './vi';

/** "a cry" thay Entry, "words from / for a stranger" thay Comfort (PRODUCT.md). */
const LANG_NAMES: Record<Lang, string> = { vi: 'Vietnamese', en: 'English', ja: 'Japanese' };
const joinList = (names: string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const en: Dictionary = {
  locale: 'en-US',
  tagSeparator: '; ',

  common: {
    back: 'Back',
    networkError: "Couldn't connect. Check your connection and try again.",
    loading: 'Loading',
    keep: 'Keep',
    needHelp: 'Need help now',
    needHelpHint: 'Hotline numbers, available even offline',
    thanked: 'thanked',
    autoTranslated: 'translated automatically',
    intensity: (n) => `intensity ${n} of 5`,
    signIn: 'Sign in',
    wordsYouWrote: 'Words you wrote',
    writeForStranger: 'Write words for a stranger',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordHint: 'At least 6 characters',
    leave: 'Leave',
    remove: 'Delete',
  },

  tab: { index: 'Journal', write: 'For strangers', calendar: 'Calendar', settings: 'Settings' },

  card: {
    photos: (n) => count(n, 'photo', 'photos'),
    recording: 'voice note',
    clipped: 'words tucked in here',
    hasComfort: 'has words from a stranger',
    hasComfortThanked: 'has words from a stranger, thanked',
    listen: 'Listen',
    pause: 'Pause',
    listenA11y: (label, seconds) =>
      `${label}, voice note, ${seconds >= 60 ? `${count(Math.floor(seconds / 60), 'minute', 'minutes')} ` : ''}${count(seconds % 60, 'second', 'seconds')}`,
  },

  duration: (minutes) =>
    minutes === null
      ? "Can't remember"
      : minutes === 5
        ? 'A few minutes'
        : minutes === 30
          ? 'Half an hour'
          : minutes === 60
            ? 'Over half an hour'
            : count(minutes, 'minute', 'minutes'),

  timeline: {
    title: 'Times I cried',
    empty: "Nothing here yet. Write when you feel like it — or don't.",
    newEntry: 'Write it down',
  },

  newEntry: {
    ago: (minutes) =>
      minutes === 0 ? 'Just now' : minutes === 60 * 24 ? 'Yesterday' : `${count(minutes / 60, 'hour', 'hours')} ago`,
    recordingInterrupted: 'The recording stopped partway. Try again.',
    discard: 'Remove',
    noCameraPermission: "Tearnote can't use the camera yet. You can allow it in your phone's Settings.",
    cameraError: "Couldn't open the camera. Try again.",
    libraryError: "Couldn't open your photos. Try again.",
    noMicPermission: "Tearnote can't use the microphone yet. You can allow it in your phone's Settings.",
    recordingStarted: 'Recording',
    recordingError: "Couldn't record. Try again.",
    saveError: "Couldn't save the photos or voice note. Tap Save again, or remove some and save.",
    title: 'How was it?',
    intro: 'No need to fill in everything. Tap Save whenever you like.',
    whenLabel: 'When?',
    howLongLabel: 'How long did it last?',
    howHeavyLabel: 'How intense was it?',
    intensityLabel: 'Intensity',
    intensityValue: (n) => `${n} of 5`,
    whyLabel: 'What was it about?',
    maxTags: (n) => `Up to ${n}. Choosing none is fine too.`,
    notesLabel: 'Anything else to write?',
    notesPlaceholder: 'Write anything. Only you can read it.',
    attachLabel: 'Add a photo or voice note?',
    attachLimit: (photos, minutes) =>
      `Up to ${photos} photos and one ${minutes}-minute voice note. They stay on this phone.`,
    removePhotoQuestion: 'Remove this photo?',
    photoN: (index) => `Photo ${index}`,
    removePhotoHint: 'Tap to remove this photo',
    recordingProgress: (elapsed, limit) => `Recording · ${elapsed} / ${limit}`,
    stopRecording: 'Stop recording',
    stopError: "Couldn't stop. Try again.",
    removeRecording: 'Remove voice note',
    removeRecordingQuestion: 'Remove this voice note?',
    takePhoto: 'Take a photo',
    pickPhoto: 'Choose photos',
    recordButton: 'Record',
    save: 'Save',
    cancel: "Never mind, don't save",
    leaveQuestion: 'Leave without saving?',
    leaveDetail: 'Unsaved words, photos and voice notes will be lost.',
    keepWriting: 'Keep writing',
    saved: 'Saved.',
  },

  calendar: {
    title: 'Calendar',
    // "Jan"… không vừa ô 22 ở máy hẹp; một chữ cái là cách viết quen của bảng cả năm.
    monthLabel: (month) => 'JFMAMJJASOND'[month - 1],
    monthSummary: (month, days, max) =>
      `${MONTHS[month - 1]}: cried on ${count(days, 'day', 'days')}. Heaviest day, combined intensity ${max}.`,
    monthEmpty: (month) => `${MONTHS[month - 1]}: no days with crying.`,
    levelRange: (from, to) => (to === undefined ? `${from} or more` : `${from} to ${to}`),
    legendA11y: (levels) => `The color deepens with the day's total intensity: ${levels.join(', ')}`,
    prevYear: 'Previous year',
    nextYear: 'Next year',
    legendTitle: 'Total intensity for the day',
  },

  settings: {
    title: 'Settings',
    signedOut: 'Signed out.',
    receiveComforts: 'Receive words from strangers',
    receiveComfortsDetail:
      "When off, you won't receive any more words from strangers. Your journal stays the same.",
    wordsYouWroteDetail: 'Read them again, or withdraw them.',
    writeForStrangerDetail: 'Requires signing in. Up to 5 in 24 hours.',
    account: 'Account',
    signOut: 'Sign out',
    signOutDetail: 'Your journal stays on this phone.',
    signInDetail: 'Not signed in. Only needed to write words for strangers.',
    language: 'Language',
  },

  entry: {
    receiveError: "Couldn't get any words just now. Try again in a little while.",
    poolEmpty: (joyOnly) =>
      `No one has written words for this${joyOnly ? ' joy' : ''} yet. This one doesn't count toward your limit.`,
    limitReached: "You've received 3 in the last 24 hours. You can't receive more yet.",
    notFound: 'Not found',
    notFoundDetail: 'This cry is no longer on this phone.',
    wordsFromStranger: 'Words from a stranger',
    noneYet: 'Nothing tucked in here yet.',
    thank: 'Thank you',
    request: 'Receive words from a stranger',
    receivingOff: "You've turned off words from strangers. You can change this in Settings.",
    searching: 'Looking for words…',
    remove: 'Delete this cry',
    removeQuestion: 'Delete this cry?',
    removeDetail: (hasComfort: boolean) =>
      `Its words, photos and voice note will be deleted from this phone. This can't be undone.${hasComfort ? ' The words from a stranger tucked in here will go too.' : ''}`,
    removed: 'Deleted.',
  },

  write: {
    sessionExpired: 'Your sign-in has expired. Sign in again and send — what you typed is still here.',
    limitReached: "You've sent 5 in the last 24 hours. You can't send more yet.",
    sendError: "Couldn't send. Your words are still here — try again in a little while.",
    title: 'Write words for a stranger',
    doneTitle: 'Your words were received',
    doneDetail:
      "They'll be reviewed first, then reach a stranger. To withdraw them, go to Settings → Words you wrote.",
    done: 'Done',
    intro:
      'Your words will reach a stranger who just cried over something similar. Neither of you knows who the other is.',
    guidance: "Share what once helped you — no advice needed. Don't include names, phone numbers or social media handles.",
    inputLabel: 'Words for a stranger',
    inputPlaceholder: 'Write what you once needed to hear.',
    counterA11y: (n, max) => `${n} of ${max} characters`,
    shortBy: (n) => ` · ${count(n, 'more character', 'more characters')} needed`,
    languageLabel: 'What language are you writing in?',
    topicLabel: 'What situation is it for?',
    pickTags: (max, unknownLabel) =>
      `Choose 1 or ${max}. If it fits anyone who is sad, choose “${unknownLabel}”.`,
    consent: (others) =>
      `By tapping Send, you agree that your words will be reviewed, translated into ${joinList(others.map((lang) => LANG_NAMES[lang]))}, and sent anonymously to strangers. You can withdraw them in Settings → Words you wrote; anyone who already received them keeps their copy.`,
    signInAgain: 'Sign in again',
    send: 'Send',
    leaveQuestion: 'Leave without sending?',
    leaveDetail: "The words you're writing will be lost.",
    keepWriting: 'Keep writing',
    needTag: 'Choose at least one situation above.',
  },

  myComforts: {
    status: {
      pending: 'Waiting for review',
      approved: 'Approved',
      rejected: 'Not sent',
      retracted: 'Withdrawn',
    },
    loadError: "Couldn't load the list. Check your connection and try again.",
    retractQuestion: 'Withdraw these words?',
    retractDetail:
      "They won't reach anyone else. Anyone who already received them keeps them. This can't be undone.",
    retract: 'Withdraw',
    retractError: "Couldn't withdraw. Check your connection and try again.",
    keptByAccount: 'Words you write are kept with your account.',
    signInToView: 'Sign in to see them',
    empty: 'Nothing yet.',
    retractA11y: (excerpt) => `Withdraw: ${excerpt}`,
    irreversible: "Can't be undone",
    retracting: 'Withdrawing…',
    retry: 'Try again',
    retracted: 'Withdrawn.',
  },

  login: {
    verificationSent: "We've sent a verification email. Once you've verified, sign in here.",
    error: "Couldn't sign in. Check your email, password and connection.",
    explanation:
      'Writing for strangers requires signing in, to keep readers safe. Readers never see your email. Keeping your journal needs no account.',
    createAccount: 'Create an account',
    later: 'Not now',
  },

  register: {
    title: 'Create account',
    createError:
      "Couldn't create the account. This email may already have one — try signing in. Or check your connection.",
    explanation: 'An account is only for writing to strangers. Readers never see your email.',
    confirmPassword: 'Confirm password',
    haveAccount: 'Already have an account? Sign in',
  },

  help: {
    intro: 'If you or someone else is in danger right now, call emergency services.',
    call: (phone) => `Call ${phone}`,
    callA11y: (name, phone) => `Call ${name}, number ${phone}`,
    openWebsite: (name) => `Open the ${name} website`,
    footer: "This list is stored on your phone and opens even offline. If a number doesn't go through, try another.",
  },
  validation: {
    emailInvalid: "That email doesn't look right — please check it.",
    passwordTooShort: 'Your password needs at least 6 characters.',
    passwordMismatch: "The passwords don't match.",
    bodyTooShort: 'Your words are a little short — add a bit more.',
    bodyTooLong: 'Your words are too long — trim them a little.',
    tagsNone: 'Pick at least one topic.',
    tagsTooMany: 'You can pick up to 2 topics.',
    langInvalid: 'Pick the language you wrote in.',
  },
};

export default en;
