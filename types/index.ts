export interface YTChannel {
    indexedDate: Date
    channelName: string
    channelId: string
    channelDescription: string
    thumbnails: YTImage[]
    country: string
    channelStatistics: {
        viewCount: number
        subscriberCount: number
        videoCount: number
    }
    videos: string[]
}

export interface YTVideo {
    etag: string
    indexedDate: Date
    properties: {
        videoId: string
        videoTitle: string
        videoDescription: string
        publishDate: string
        channelId: string
        channelTitle: string
    }
    thumbnails: YTImage[],
    statistics: {
        viewCount: number
        likeCount: number
        dislikeCount: number
        commentCount: number
        likeDislikeRatio?: number
    }
    status: {
        privacyStatus: string
        embeddable: boolean
    }
}

export interface YTImage {
    url: string
    width: number
    height: number
}

export interface YTIdentity {
    email: string
    channelId: string
}

export interface YTVideoStatisticsBody {
    videoId: string
    history: YTVideoStatistics[]
}

export interface YTChannelStatistics {
    viewCount: string
    subscriberCount: string
    videoCount: string
}

export interface YTVideoStatistics {
    date: Date
    viewCount: string
    likeCount: string
    dislikeCount: string
    commentCount: string
}