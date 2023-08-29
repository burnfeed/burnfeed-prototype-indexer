import { BigInt,store } from '@graphprotocol/graph-ts'
import { Follow,UnFollow,Like,UnLike,NewTweet,NewComment,Quote,Repost } from '../generated/SimPubProtocol/SimPubProtocol'
import { User,Tweet,Like as LikeTweet,Follow as FollowTweet } from '../generated/schema'

function checkIdValidation(tweetId: string): boolean{
  
  return tweetId.startsWith("Qm") && (tweetId.length === 46)
}

export function handleFollow(event: Follow): void {
  // get followeeId & followerId，will be used to update user profile
  let followeeId = event.params.followee.toHexString()
  let followerId = event.params.follower.toHexString()

  // if followee not exist, create a new one
  let followee = User.load(followeeId as string)
  if (followee === null) {
    followee = new User(followeeId as string)
    followee.followees = []
    followee.followers = []
    followee.followeesCount = 0
    followee.followersCount = 0
    followee.tweetsCount = 0
    followee.commentsCount = 0
    followee.likesCount = 0
    followee.retweetsCount = 0
    followee.lastTweetUpdate = BigInt.fromI32(0)
  }

  // if follower not exist, create a new one
  let follower = User.load(followerId)
  if (follower === null) {
    follower = new User(followerId)
    follower.followees = []
    follower.followers = []
    follower.followeesCount = 0
    follower.followersCount = 0
    follower.tweetsCount = 0
    follower.commentsCount = 0
    follower.likesCount = 0
    follower.retweetsCount = 0
    follower.lastTweetUpdate = BigInt.fromI32(0)
  }

  // update followers & followersCount in followee.  followers means the guys that are following this user
  let followers = followee.followers
  followers.push(followerId)
  followee.followers = followers
  followee.followersCount = followee.followersCount + 1
  followee.save()

  // update followees & followeesCount in follower. followees means the guys that this user is following 
  let followees = follower.followees
  followees.push(followeeId)
  follower.followees = followees
  follower.followeesCount = follower.followeesCount + 1
  follower.save()


  // create a new Follow Entity for further user
  let followId = followeeId + followerId
  let follow = FollowTweet.load(followId)
  if (follow != null) {
    return
  }
  follow =  new FollowTweet(followId)
  follow.followee = followeeId
  follow.follower = followerId
  follow.timestamp = event.block.timestamp
  follow.save()

}

export function handleUnFollow(event: UnFollow): void {
  // get followeeId & followerId，will be used to update user profile
  let followeeId = event.params.followee.toHexString()
  let followerId = event.params.unfollower.toHexString()

  // if followee not exist, do nothing
  let followee = User.load(followeeId)
  if (followee === null) {
    return
  }

  // if follower not exist, do nothing
  let follower = User.load(followerId)
  if (follower === null) {
    return
  }

  // get followId, will be used to remove Follow Entity
  let followId = followeeId + followerId
  let follow = FollowTweet.load(followId)
  if (follow === null) {
    return
  }
  // remove Follow Entity, as it is not used anymore
  store.remove('Follow',followId)

  // get the follower index in followee.followers, as we are going to remove follower in followee.followers
  let followers = followee.followers
  let followerIdx = followers.indexOf(followerId);

  // get the followee index in follower.followees, as we are going to remove followee in follower.followees
  let followees = follower.followees
  let followeesIdx = followees.indexOf(followeeId);

  // if followerIdx or followeesIdx is -1, means no associated user exists, so we do nothing
  if(followerIdx == -1 || followeesIdx == -1 ){
    return
  }

  // remove follower in followee.followers, refer to "AAVE V2 graph"
  followers[followerIdx] = followers[followers.length - 1]
  followers.pop()
  followee.followers = followers
  followee.followersCount = followee.followersCount - 1
  followee.save()

  // remove followee in follower.followees, refer to "AAVE V2 graph"
  followees[followeesIdx] = followees[followees.length - 1]
  followees.pop()
  follower.followees = followees
  follower.followeesCount = follower.followeesCount - 1
  follower.save()
}



export function handleLike(event: Like): void {
  let tweetId =  event.params.tweet
  let originTweet = Tweet.load(tweetId)
  // if tweeet not exist, maybe a fake transaction, ignore it
  if (originTweet === null) {
    return
  }
  // update tweet's likesCount
  originTweet.likesCount = originTweet.likesCount + 1
  originTweet.save()

  let userId = event.params.user.toHexString()
  let user = User.load(userId)

  // if user not exist, create a new one
  if (user === null) {
    user = new User(userId)
    user.followees = []
    user.followers = []
    user.followeesCount = 0
    user.followersCount = 0
    user.tweetsCount = 0
    user.retweetsCount = 0
    user.commentsCount = 0
    user.likesCount = 0
    user.retweetsCount = 0
    user.lastTweetUpdate = BigInt.fromI32(0)
  }
  // update user likesCount
  user.likesCount = user.likesCount + 1
  

  // get likeId
  let likeId = userId + tweetId
  let liketweet = LikeTweet.load(likeId)
  // if like entity not exist, create a new one
  if (liketweet === null) {
    liketweet = new LikeTweet(likeId)
  }

  // update like entity
  liketweet.user = userId
  liketweet.tweet = tweetId
  liketweet.timestamp = event.block.timestamp
  liketweet.save()

  //user.likes.push(likeId)
  user.save()
}

export function handleUnLike(event: UnLike): void {
  let tweetId =  event.params.tweet
  let originTweet = Tweet.load(tweetId)
  // if tweet not exist, most likely a fake transaction, ignore it
  if (originTweet === null) {
    return
  }

  let userId = event.params.user.toHexString()
  let user = User.load(userId)
  // if user not exist, most likely a fake transaction, ignore it
  if (user === null) {
    return
  }

  let likeId = userId + tweetId
  let liketweet = LikeTweet.load(likeId)
  // if like not exist, most likely a fake transaction, ignore it
  if(liketweet === null){
    return
  }
  // if tweet's & user's  likesCount
  originTweet.likesCount = originTweet.likesCount - 1
  originTweet.save()
  user.likesCount = user.likesCount - 1
  //user.likes.pop()
  user.save()
 
  // remove the like entity, as it is no more used
  store.remove('Like',likeId)
}


export function handleNewTweet(event: NewTweet): void {
  let tweetId =  event.params.tweet.toString()
  let userId = event.params.creator.toHexString()

  if(!checkIdValidation(tweetId)){
    return
  }
  //if tweet not exist, most likely a fake transaction, ignore it
  let newTweet = Tweet.load(tweetId)
  if (newTweet != null) {
    return
  }
  // init tweet profile
  newTweet = new Tweet(tweetId)
  newTweet.user = userId
  newTweet.subtype = 0
  newTweet.timestamp = event.block.timestamp
  newTweet.burn = event.params.burn
  newTweet.commentsCount = 0
  newTweet.likesCount = 0
  newTweet.retweetCount = 0
  newTweet.save()

  // if user not exist, create a new one
  let user = User.load(userId)
  if (user === null) {
    user = new User(userId)
    user.followees = []
    user.followers = []
    user.followeesCount = 0
    user.followersCount = 0
    user.tweetsCount = 0
    user.retweetsCount = 0
    user.commentsCount = 0
    user.likesCount = 0
  }
  // update user's tweetsCount & lastTweetUpdate
  user.tweetsCount = user.tweetsCount + 1
  user.lastTweetUpdate = event.block.timestamp
 // user.tweets.push(tweetId)
  user.save()

}

export function handleRepost(event: Repost): void {
  let tweetId =  event.params.tweet.toString()
  let userId = event.params.user.toHexString()
  let repostId = event.params.newTweet.toString()
  // if tweet not exist, most likely a fake transaction, ignore it
  let originTweet = Tweet.load(tweetId)
  if(originTweet === null){
    return
  }

  if(!checkIdValidation(tweetId) || !checkIdValidation(repostId)){
    return
  }

  originTweet.retweetCount = originTweet.retweetCount + 1
  //originTweet.reposts.push(repostId)
  originTweet.save()


  //if repost tweet exist, most likely a fake transaction, ignore it
  let newTweet = Tweet.load(repostId)
  if(newTweet != null){
    return
  }

  // if user not exist, create a new one
  let user = User.load(userId)
  if (user === null) {
    user = new User(userId)
    user.followees = []
    user.followers = []
    user.followeesCount = 0
    user.followersCount = 0
    user.tweetsCount = 0
    user.retweetsCount = 0
    user.commentsCount = 0
    user.likesCount = 0
  }
  // update user's retweetsCount & lastTweetUpdate
  user.retweetsCount = user.retweetsCount + 1
  user.lastTweetUpdate = event.block.timestamp
 // user.tweets.push(repostId)
  user.save()

  //as we are also regarding repost as a tweet, so create a new tweet for repost
  newTweet = new Tweet(repostId)
  newTweet.user = userId
  newTweet.repostOriginTweet = tweetId
  newTweet.subtype = 6
  newTweet.timestamp = event.block.timestamp
  newTweet.burn = event.params.burn
  newTweet.commentsCount = 0
  newTweet.likesCount = 0
  newTweet.retweetCount = 0
  newTweet.save()
}


export function handleQuote(event: Quote): void {
  let tweetId =  event.params.tweet.toString()
  let userId = event.params.user.toHexString()
  let quoteId = event.params.newTweet.toString()
  // if tweet not exist, most likely a fake transaction, ignore it
  let originTweet = Tweet.load(tweetId)
  if(originTweet === null){
    return
  }
  if(!checkIdValidation(tweetId) || !checkIdValidation(quoteId)){
    return
  }

  originTweet.retweetCount = originTweet.retweetCount + 1
 // originTweet.quotes.push(quoteId)
  originTweet.save()

  //if quote tweet exist, most likely a fake transaction, ignore it
  let newTweet = Tweet.load(quoteId)
  if(newTweet != null){
    return
  }

  // if user not exist, create a new one
  let user = User.load(userId)
  if (user === null) {
    user = new User(userId)
    user.followees = []
    user.followers = []
    user.followeesCount = 0
    user.followersCount = 0
    user.tweetsCount = 0
    user.retweetsCount = 0
    user.commentsCount = 0
    user.likesCount = 0
  }
  // update user's tweetsCount & lastTweetUpdate
  user.retweetsCount = user.retweetsCount + 1
  user.lastTweetUpdate = event.block.timestamp
 // user.tweets.push(quoteId)
  user.save()
  
  //as we are also regarding quote as a tweet, so create a new tweet for quote
  newTweet = new Tweet(quoteId)
  newTweet.user = userId
  newTweet.quoteOriginTweet = tweetId
  newTweet.subtype = 7
  newTweet.timestamp = event.block.timestamp
  newTweet.burn = event.params.burn
  newTweet.commentsCount = 0
  newTweet.likesCount = 0
  newTweet.retweetCount = 0
  newTweet.save()
}


export function handleNewComment(event: NewComment): void {
  let tweetId =  event.params.tweet.toString()
  let userId = event.params.user.toHexString()
  let commentId = event.params.newTweet.toString()

  // if tweet not exist, most likely a fake transaction, ignore it
  let originTweet = Tweet.load(tweetId)
  if (originTweet === null) {
    return
  }

  if(!checkIdValidation(tweetId) || !checkIdValidation(commentId)){
    return
  }

  originTweet.commentsCount = originTweet.commentsCount + 1
  //originTweet.comments.push(commentId)
  originTweet.save()

    //if comment tweet exist, most likely a fake transaction, ignore it
  let newTweet = Tweet.load(commentId)
  if(newTweet != null){
    return
  }


  // if user not exist, create a new one
  let user = User.load(userId)
  if (user === null) {
    user = new User(userId)
    user.followees = []
    user.followers = []
    user.followeesCount = 0
    user.followersCount = 0
    user.tweetsCount = 0
    user.retweetsCount = 0
    user.commentsCount = 0
    user.likesCount = 0
    user.lastTweetUpdate = BigInt.fromI32(0)
  }
  // update user's commentsCount
  user.commentsCount = user.commentsCount + 1
 // user.tweets.push(commentId)
  user.save()


  //as we are also regarding comment as a tweet, so create a new tweet for comment
  newTweet = new Tweet(commentId)
  newTweet.user = userId
  newTweet.commentOriginTweet = tweetId
  newTweet.subtype = 1
  newTweet.timestamp = event.block.timestamp
  newTweet.burn = event.params.burn
  newTweet.commentsCount = 0
  newTweet.retweetCount = 0
  newTweet.likesCount = 0
  newTweet.save()
}

