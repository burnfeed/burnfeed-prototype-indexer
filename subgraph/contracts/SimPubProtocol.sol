// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Simple Publishing Protocol
 * @author Daniel Wang <dan@taiko.xyz>
 * @dev A dead simple contract that allows the publication of any data to the
 * blockchain. It may be completely useless or very useful.
 */
contract SimPubProtocol is Ownable {

    struct Action {
        uint8 subtype;  //0 tweet, 1 comment, 2 like, 3 unlike, 4 follow, 5 unfollow, 6 repost 7 quote
        string tweet;  
        string newTweet;
        address followee;
        uint256 burn;
    }

    // follow or not
    event Follow(
        address indexed followee,
        address indexed follower
    );

     event UnFollow(
        address indexed followee,
        address indexed unfollower
    );

   // like or not 
    event Like(
        address indexed user,
        string tweet 
      
    );

    event UnLike(
        address indexed user,
        string tweet 
      
    );
    
    event NewTweet(
         address indexed creator,
         string tweet ,
         uint256 burn
       
    );
     
     //just retweet 
    event Repost(
         address indexed user, string tweet, string newTweet, uint256 burn
    );
    
    // retweet with comment
     event Quote(
         address indexed user, string tweet, string newTweet, uint256 burn
    );
    

     event NewComment(
        address indexed user,
        string tweet,
        string newTweet,
        uint256 burn
    );

      function publishActions(
        Action[] memory actions
    )
        external payable
    {
        uint len = actions.length;
        uint burnAmount;
        for(uint i=0; i<len; i++) {
            
            Action memory action = actions[i];
            burnAmount  =  burnAmount +  action.burn;
            //0 tweet, 1 comment, 2 like, 3 unlike, 4 follow, 5 unfollow, 6 retweet
          if(action.subtype == 0){
            emit NewTweet(msg.sender, action.tweet, action.burn);
          } else if(action.subtype == 1) {
            emit NewComment(msg.sender, action.tweet, action.newTweet, action.burn);
          } else if(action.subtype == 2) {
            emit Like(msg.sender, action.tweet);
          } else if(action.subtype == 3) {
            emit UnLike(msg.sender, action.tweet);
          } else if(action.subtype == 4) {
            emit Follow(action.followee, msg.sender);
          }  else if(action.subtype == 5) {
            emit UnFollow(action.followee, msg.sender);
          } else if(action.subtype == 6) {
            emit Repost(msg.sender, action.tweet, action.newTweet, action.burn);
          } else if(action.subtype == 7) {
            emit Quote(msg.sender, action.tweet, action.newTweet, action.burn);
          }
        }
        require(msg.value == burnAmount, "burn amount not match");
    }



    function withdrawETH(address to) external onlyOwner {
        payable(to).transfer(address(this).balance);
    }

      function withdrawERC20Token(address token_, address to, uint256 amount) external onlyOwner returns (bool) {
        uint256 balance = IERC20(token_).balanceOf(address(this));
        require(balance >= amount, "NOT_ENOUGH_BALANCE");
        require(IERC20(token_).transfer(to, amount));
        return true;
    }
}



    // /**
    //  * @dev Emitted when a user publishes data.
    //  * @param user The address of the user who published the data.
    //  * @param spec An ID representing the nature of the published data.
    //  * @param uriType The type of the URI indicating where to retrieve the data.
    //  * @param uri The URI that points to the published data.
    //  * @param burn The amount of Ether burned (if any) to increase visibility.
    //  */
    // event Publication(
    //     address indexed user,
    //     bytes32 indexed spec,
    //     bytes32 indexed uriType,
    //     string uri,
    //     uint256 burn
    // );

      // /**
    //  * @notice Publish any data, optionally burning Ether to increase attention.
    //  * @dev The publish function allows a user to broadcast data to the
    //  * blockchain.
    //  * @param spec An ID indicating the nature of the published data.
    //  * @param uriType The type of the URI specifying where the data can be
    //  * accessed.
    //  * @param uri The URI of the published data.
    //  */
    // function publish(
    //     bytes32 spec,
    //     bytes32 uriType,
    //     string calldata uri
    // )
    //     external
    //     payable
    // {
    //     // Do nothing, but
    //     emit Publication(msg.sender, spec, uriType, uri, msg.value);
    // }

