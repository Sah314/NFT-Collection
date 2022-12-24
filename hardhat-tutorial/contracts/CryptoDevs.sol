//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable,Ownable{

string _baseTokenURI;

uint256 public _price = 0.01 ether;

bool public _paused;

uint256 public maxTokenIds = 20;

uint256 public tokenIds;
IWhitelist whitelist;

bool public presalestarted;

uint256 public presaleends;

modifier onlywhennotpaused{
    require(!_paused,"Contract paused!!");
    _;
}
constructor (string memory baseURI, address whitelistContract) ERC721("Crypto Devs","CD"){
    _baseTokenURI = baseURI;
    whitelist = IWhitelist(whitelistContract);
}

function presalestart() public onlyOwner{
presalestarted =true;
presaleends = block.timestamp + 5 minutes;
}

function presalemint() public payable onlywhennotpaused{
require(presalestarted && block.timestamp < presaleends,"Presale not currently running!");
require(whitelist.whitelistedAddresses(msg.sender),"You are not in the whitelist");
require(tokenIds<maxTokenIds,"Exceeded maximum limit of devs");
require(msg.value>_price,"Ether sent is not correct");
tokenIds+=1;
_safeMint(msg.sender, tokenIds);
}

function mint() public payable onlywhennotpaused{
require(presalestarted && block.timestamp < presaleends,"Presale not currently running!");

  require(tokenIds<maxTokenIds,"Exceeded maximum limit of devs");
require(msg.value>_price,"Ether sent is not correct");
tokenIds+=1;
_safeMint(msg.sender, tokenIds);  
}

function _baseURI() internal view virtual override returns (string memory){
    return _baseTokenURI;
}
function setpaused(bool p) public onlyOwner{
_paused=p;
}

function withdraw() public onlyOwner{
    address _owner = owner();
    uint256 amount = address(this).balance;  
    (bool sent,)  = _owner.call{value:amount}("");
    require(sent, "Failed to send Ether");
}
receive() external payable {}

fallback() external payable {}

}

