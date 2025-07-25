import tweetsData from './data.js'
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

// Memory cache - undefined on purpose!
let userDataCache = undefined

const inputEl = document.getElementById("tweet-input")

// INITIALIZE LOCALSTORAGE
function initStorage() {
   if (!localStorage.getItem('userData')) {
      userDataCache = { tweets: tweetsData }
      persistToStorage()
   } 
   else {
      const storedData = JSON.parse(localStorage.getItem('userData'))
      userDataCache = {
         tweets: storedData.tweets || 
            (storedData.tweetedTweets ? [...storedData.tweetedTweets, ...tweetsData] 
               : tweetsData)
      }
      persistToStorage()
   }
}
initStorage()

// PERSIST TO LOCAL STORAGE
function persistToStorage() {
   localStorage.setItem('userData', JSON.stringify(userDataCache))
}

// EVENT HANDLERS
document.addEventListener('click', (e) => {
   if (e.target.dataset.like) {
      handleInteraction(e.target.dataset.like, 'like')
   } else if (e.target.dataset.retweet) {
      handleInteraction(e.target.dataset.retweet, 'retweet')
   } else if (e.target.dataset.reply) {
      handleReplyClick(e.target.dataset.reply)
   } else if (e.target.dataset.delete) {
      handleDeleteClick(e.target.dataset.delete)
   } else if (e.target.id === 'tweet-btn') {
      handleTweetBtnClick()
   }
})

inputEl.addEventListener('keydown', (e) => {
   if (e.key === "Enter") {
      handleTweetBtnClick()
   }
})

// FIND TWEET FUNCTION
function findTweet(tweetId) {
   return userDataCache.tweets.find(tweet => tweet.uuid === tweetId)
}

// LIKES & RETWEETS (GENERIC) HANDLER
function handleInteraction(tweetId, type) {
   const tweet = findTweet(tweetId)
   if (!tweet) return

   const isLike = type === 'like'
   const interactionType = isLike ? 'isLiked' : 'isRetweeted'
   const counter = isLike ? 'likes' : 'retweets'

   // Update state and counter
   tweet[interactionType] = !tweet[interactionType]
   tweet[counter] += tweet[interactionType] ? 1 : -1

   // Update tweet in userDataCache.tweets
   const tweetIndex = userDataCache.tweets.findIndex(t => t.uuid === tweetId)
   if (tweetIndex !== -1) {
      userDataCache.tweets[tweetIndex] = tweet
   }

   persistToStorage()
   render()
}

// REPLIES HANDLER
function handleReplyClick(replyId) {
   document.getElementById('replies-' + replyId).classList.toggle('hidden')
}

// DELETE TWEETS (user's only)
function handleDeleteClick(tweetId) {
   userDataCache.tweets = userDataCache.tweets
      .filter(t => t.uuid !== tweetId || t.handle !== '@yoDalonso') // -----> hardcoded value here!
   
   persistToStorage()
   render()
}

// PUBLISH NEW TWEET
function handleTweetBtnClick() {
   if (!inputEl.value) return

   userDataCache.tweets.unshift({
      handle: '@yoDalonso',
      profilePic: 'images/dalonso-color.png',
      likes: 0,
      retweets: 0,
      tweetText: inputEl.value,
      replies: [],
      isLiked: false,
      isRetweeted: false,
      uuid: uuidv4()
   })

   persistToStorage()
   inputEl.value = ''
   render()
}

// GET HTML FEED
function getFeedHtml() {
   let html = ''

   userDataCache.tweets.forEach(tweet => {
      const likeClass = tweet.isLiked ? 'liked' : ''
      const retweetClass = tweet.isRetweeted ? 'retweeted' : ''
      
      let repliesHtml = ''
      if (tweet.replies) {
         tweet.replies.forEach(reply => {
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

// RENDER FUNCTION (final)
function render() {
   const feed = document.getElementById('feed')
   const tempDiv = document.createElement('div')
   tempDiv.innerHTML = getFeedHtml()
   feed.innerHTML = ''
   feed.append(...tempDiv.childNodes)
}

// INITIALIZE
render()
