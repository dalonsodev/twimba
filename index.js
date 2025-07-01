import { tweetsData } from './data.js'
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

// 1. INICIALIZAR LOCALSTORAGE
function initStorage() {
    if (!localStorage.getItem('userData')) {
        const initialUserData = {
            tweetedTweets: [],
            likedTweets: [],
            retweetedTweets: []
        }
        localStorage.setItem('userData', JSON.stringify(initialUserData))
    }
}
initStorage()

// 2. SINCRONIZAR ESTADOS (likes/retweets)
function syncWithLocalStorage() {
    const userData = JSON.parse(localStorage.getItem('userData'))

    // Actualizar tweetsData (dummy)
    tweetsData.forEach(function(tweet) {
        tweet.isLiked = userData.likedTweets.includes(tweet.uuid)
        tweet.isRetweeted = userData.retweetedTweets.includes(tweet.uuid)
    })

    // Actualizar tweets del usuario
    userData.tweetedTweets.forEach(function(tweet) {
        tweet.isLiked = userData.likedTweets.includes(tweet.uuid)
        tweet.isRetweeted = userData.retweetedTweets.includes(tweet.uuid)
    })

    localStorage.setItem('userData', JSON.stringify(userData))
}
syncWithLocalStorage()

// 3. MANEJADORES DE EVENTOS
document.addEventListener('click', function(e) {
    if (e.target.dataset.like) {
        handleLikeClick(e.target.dataset.like)
    } else if (e.target.dataset.retweet) {
        handleRetweetClick(e.target.dataset.retweet)
    } else if (e.target.dataset.reply) {
        handleReplyClick(e.target.dataset.reply)
    } else if (e.target.dataset.delete) {
        handleDeleteClick(e.target.dataset.delete)
    } else if (e.target.id === 'tweet-btn') {
        handleTweetBtnClick()
    }
})

// 4. FUNCIÓN PARA BUSCAR TWEETS (en ambos arrays)
function findTweet(tweetId) {
    const userData = JSON.parse(localStorage.getItem('userData'))
    let tweet = null
    
    // Buscar en tweets del usuario
    userData.tweetedTweets.forEach(function(t) {
        if (t.uuid === tweetId) {
            tweet = t
        }
    })
    
    // Si no está, buscar en tweetsData
    if (!tweet) {
        tweetsData.forEach(function(t) {
            if (t.uuid === tweetId) {
                tweet = t
            }
        })
    }
    
    return tweet
}

// 5. MANEJADOR DE LIKES (funciona para ambos tipos de tweets)
function handleLikeClick(tweetId) {
    const tweet = findTweet(tweetId)
    if (!tweet) return

    const userData = JSON.parse(localStorage.getItem('userData'))

    // Actualizar estado
    tweet.isLiked = !tweet.isLiked
    tweet.likes += tweet.isLiked ? 1 : -1

    // Actualizar lista de likes
    const likeIndex = userData.likedTweets.indexOf(tweetId)
    if (tweet.isLiked && likeIndex === -1) {
        userData.likedTweets.push(tweetId)
    } else if (!tweet.isLiked && likeIndex !== -1) {
        userData.likedTweets.splice(likeIndex, 1)
    }

    // Si es tweet del usuario, actualizarlo en el array
    let userTweetIndex = -1
    userData.tweetedTweets.forEach(function(t, index) {
        if (t.uuid === tweetId) {
            userTweetIndex = index
        }
    })
    
    if (userTweetIndex !== -1) {
        userData.tweetedTweets[userTweetIndex] = tweet
    }

    localStorage.setItem('userData', JSON.stringify(userData))
    render()
}

// 6. MANEJADOR DE RETWEETS (igual que likes)
function handleRetweetClick(tweetId) {
    const tweet = findTweet(tweetId)
    if (!tweet) return

    const userData = JSON.parse(localStorage.getItem('userData'))

    tweet.isRetweeted = !tweet.isRetweeted
    tweet.retweets += tweet.isRetweeted ? 1 : -1

    const rtIndex = userData.retweetedTweets.indexOf(tweetId)
    if (tweet.isRetweeted && rtIndex === -1) {
        userData.retweetedTweets.push(tweetId)
    } else if (!tweet.isRetweeted && rtIndex !== -1) {
        userData.retweetedTweets.splice(rtIndex, 1)
    }

    let userTweetIndex = -1
    userData.tweetedTweets.forEach(function(t, index) {
        if (t.uuid === tweetId) {
            userTweetIndex = index
        }
    })
    
    if (userTweetIndex !== -1) {
        userData.tweetedTweets[userTweetIndex] = tweet
    }

    localStorage.setItem('userData', JSON.stringify(userData))
    render()
}

// 7. MANEJADOR DE RESPUESTAS (sin cambios)
function handleReplyClick(replyId) {
    document.getElementById('replies-' + replyId).classList.toggle('hidden')
}

// 8. ELIMINAR TWEETS (solo los del usuario)
function handleDeleteClick(tweetId) {
    const userData = JSON.parse(localStorage.getItem('userData'))
    const newTweets = []
    
    userData.tweetedTweets.forEach(function(t) {
        if (t.uuid !== tweetId) {
            newTweets.push(t)
        }
    })
    
    userData.tweetedTweets = newTweets
    localStorage.setItem('userData', JSON.stringify(userData))
    render()
}

// 9. PUBLICAR NUEVO TWEET
function handleTweetBtnClick() {
    const tweetInput = document.getElementById('tweet-input')
    if (!tweetInput.value) return

    const userData = JSON.parse(localStorage.getItem('userData'))

    userData.tweetedTweets.unshift({
        handle: '@yoDalonso',
        profilePic: 'images/dalonso-color.png',
        likes: 0,
        retweets: 0,
        tweetText: tweetInput.value,
        replies: [],
        isLiked: false,
        isRetweeted: false,
        uuid: uuidv4()
    })

    localStorage.setItem('userData', JSON.stringify(userData))
    tweetInput.value = ''
    render()
}

// 10. RENDERIZADO (HTML completo)
function getFeedHtml() {
    const userData = JSON.parse(localStorage.getItem('userData'))
    const allTweets = userData.tweetedTweets.concat(tweetsData)
    let html = ''

    allTweets.forEach(function(tweet) {
        const likeClass = tweet.isLiked ? 'liked' : ''
        const retweetClass = tweet.isRetweeted ? 'retweeted' : ''
        
        let repliesHtml = ''
        if (tweet.replies) {
            tweet.replies.forEach(function(reply) {
                repliesHtml += `
                    <div class="tweet-reply">
                        <div class="tweet-inner">
                            <img src="${reply.profilePic}" class="profile-pic">
                            <div>
                                <p class="handle">${reply.handle}</p>
                                <p class="tweet-text">${reply.tweetText}</p>
                            </div>
                        </div>
                    </div>
                `
            })
        }

        if (tweet.handle === '@yoDalonso') {
            html += `
                <div class="tweet">
                    <div class="tweet-inner">
                        <img src="${tweet.profilePic}" class="profile-pic">
                        <div>
                            <p class="handle">${tweet.handle}</p>
                            <p class="tweet-text">${tweet.tweetText}</p>
                            <div class="tweet-details wider">
                                <span class="tweet-detail">
                                    <i class="fa-regular fa-comment-dots" data-reply="${tweet.uuid}"></i>
                                    ${tweet.replies ? tweet.replies.length : 0}
                                </span>
                                <span class="tweet-detail">
                                    <i class="fa-solid fa-heart ${likeClass}" data-like="${tweet.uuid}"></i>
                                    ${tweet.likes}
                                </span>
                                <span class="tweet-detail">
                                    <i class="fa-solid fa-retweet ${retweetClass}" data-retweet="${tweet.uuid}"></i>
                                    ${tweet.retweets}
                                </span>
                                <span class="tweet-detail">
                                    <i class="fa-solid fa-trash" data-delete="${tweet.uuid}"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="hidden" id="replies-${tweet.uuid}">${repliesHtml}</div>
                </div>
            `
        } else {
            html += `
                <div class="tweet">
                    <div class="tweet-inner">
                        <img src="${tweet.profilePic}" class="profile-pic">
                        <div>
                            <p class="handle">${tweet.handle}</p>
                            <p class="tweet-text">${tweet.tweetText}</p>
                            <div class="tweet-details">
                                <span class="tweet-detail">
                                    <i class="fa-regular fa-comment-dots" data-reply="${tweet.uuid}"></i>
                                    ${tweet.replies ? tweet.replies.length : 0}
                                </span>
                                <span class="tweet-detail">
                                    <i class="fa-solid fa-heart ${likeClass}" data-like="${tweet.uuid}"></i>
                                    ${tweet.likes}
                                </span>
                                <span class="tweet-detail">
                                    <i class="fa-solid fa-retweet ${retweetClass}" data-retweet="${tweet.uuid}"></i>
                                    ${tweet.retweets}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="hidden" id="replies-${tweet.uuid}">${repliesHtml}</div>
                </div>
            `
        }
    })

    return html
}

// 11. FUNCIÓN RENDER (final)
function render() {
    document.getElementById('feed').innerHTML = getFeedHtml()
}

// Iniciar
render()