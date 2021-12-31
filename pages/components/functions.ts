export const formatTimeSinceRelease = (date:string) => {
    const currentDate = new Date().getTime()
    const videoDate = new Date(date).getTime()
    const ms =  currentDate - videoDate
    const days = `${Math.floor(ms / 1000 / 60 / 60 / 24)} days ago`
    return days
}

export const formatDateAsLocale = (date:string) => { return new Date(date).toLocaleDateString() }

export const countryCodeToEmoji = (cc:string) => {
    const countryCodeRegex = /^[a-z]{2}$/i
    const offsetFromASCII = 127397
    if (!countryCodeRegex.test(cc)) {
        throw new Error("cringe country code did not work")
    }
    //@ts-ignore
    const codePoints = Array.from(cc).map(c => c.codePointAt() + offsetFromASCII)
    return String.fromCodePoint(...codePoints)
}

export const likeDislikeRatio = (likes:string, dislikes:string) => {
    const [ likeN, dislikeN ] = [parseInt(likes), parseInt(dislikes)]
    if (dislikeN == 0) {
        return 1
    } else {
        return ((1 - 1 /(likeN / dislikeN))).toFixed(4)
    }
}