import {Contract,providers,utils} from "ethers";
import Head from 'next/head'
import {useEffect,useRef,useState} from "react";
import Web3Modal from "web3modal";
import {abi, NFT_CONTRACT_ADDRESS} from "../constants";
import styles from '../styles/Home.module.css'
import Image from 'next/image'


export default function Home() {

  const [walletConnected,setWalletConnected] = useState(false);
  
  const [presaleStarted, setPresalestarted] = useState(false);
  
  const [presaleEnded , setPresaleEnded] = useState(false);
  
  const [loading, setloading] = useState(false);
  
  const [isOwner,setIsOwner] = useState(false);

  const [tokenIdsMinted,setTokenIdsMinted] = useState("0");
  const web3ModalRef =useRef();

  const getProviderorSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
  
    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const presaleMint = async()=>{
    try{
      const signer = await getProviderorSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,signer);
      const tx = await nftContract.presalemint({
        value: utils.parseEther("0.001"),
      });
      setloading(true);
      await tx.wait();
      setloading(false);
      window.alert("Successful in minting a Crypto Dev");
    }
    catch(err){
      console.error(err)
    }
  };
  const publicMint = async()=>{
    try{
      const signer = await getProviderorSigner(true);
    const nftContract  = new Contract(NFT_CONTRACT_ADDRESS,abi,signer);
    const tx = await nftContract.mint({
      value: utils.parseEther("0.01")
    });
    setloading(true);
    await tx.wait();
    setloading(false);
    
    window.alert("Success in minting a Crypto Dev ");
    }
    catch(err){
      console.error(err);
    }
  };
  const connectWallet = async()=>{
    
    try{await getProviderorSigner();
    setWalletConnected(true);
  }
  catch(err){
    console.error(err);
  }
};
const startPresale = async()=>{
  try{
    const signer = await getProviderorSigner(true);
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,signer);
    const tx = await nftContract.presalestart();
    setloading(true);
    await tx.wait();
    setloading(false);

    await checkIfPresalestarted();
  }
  catch(err){
    console.error(err);
  }
};
const checkIfPresalestarted = async()=>{
  try{
    const provider = await getProviderorSigner();
    
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);
    const _presaleStarted = await nftContract.presalestarted();
    if(!_presaleStarted){
      await getOwner();
    }
    setPresalestarted(_presaleStarted);
    console.log("_presalestarted",_presaleStarted);
    return _presaleStarted;
  }
  catch(err){
    console.error(err);
    return false;
  }
};

const checkIfpresaleended = async()=>{
  try{
    const provider = await getProviderorSigner();
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);
    const _presaleEnded = await nftContract.presaleends();
    
    const hasEnded = _presaleEnded.lt(Math.floor(Date.now()/1000));
    if(hasEnded){
      setPresaleEnded(true);
    }
    else{
      setPresaleEnded(false);
    }
    return hasEnded;
  }
  catch(err){
    console.error(err);
    return false;
  }
};

const getOwner =  async()=>{
  try{
    const provider = await getProviderorSigner();
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);
    const _owner = await nftContract.owner();
    const signer = await getProviderorSigner(true);
    const address = await signer.getAddress();
    if(address.toLowerCase() === _owner.toLowerCase()){
      setIsOwner(true);
    }
  }
  catch(err){
    console.error(err);
  }
};
const getTokenIdsMinted = async()=>{
  try{
    const provider = await getProviderorSigner();
    console.log(provider);
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);
    const _tokenIds = await nftContract.tokenIds();
    setTokenIdsMinted(_tokenIds.toString());
  }
  catch(err){
    console.error(err);
  }
};
const onPageLoad = async()=>{
  await connectWallet();
  setPresalestarted(true);
  const _presaleStarted = checkIfPresalestarted();
    if(_presaleStarted){
      checkIfpresaleended();
    }
    getTokenIdsMinted();
    const presaleEndedInterval = setInterval(async function(){
      const _presaleStarted=await checkIfPresalestarted();
      if(_presaleStarted){
        const _presaleEnded = await checkIfpresaleended();
      if(_presaleEnded){
        clearInterval(presaleEndedInterval);
      }
    }
    },5*1000);
    setInterval(async function(){
      await getTokenIdsMinted();
    },5*1000);
 };

useEffect(()=>{
  if(!walletConnected){
    web3ModalRef.current = new Web3Modal({
      network:"goerli",
      providerOptions:{},
      disableInjectedProvider:false,
    });
    onPageLoad();
  }
});

const RenderButton = ()=>{
if(!walletConnected){
  return(
    <button onClick={connectWallet} className ={styles.button}>Connect your wallet</button>
  );
}
if(loading){
  return <button className={styles.button}>Loading...</button>
}
if(isOwner && !presaleStarted){
  return (
    <button className={styles.button} onClick = {startPresale}>Start Presale!!</button>
  );
}
  if(!presaleStarted){
    return(
      <div>
          <div className={styles.description}>Presale has not started!</div>
        </div>
    );
  }

  if(presaleStarted && !presaleEnded){
    return(
      <div>
        <div className={styles.description}>
          Presale has started!! yay!! if your address is whitelisted, Mint a crypto🥳
        </div>
        <button className ={styles.button} onClick={presaleMint}>Presale Mint 🚀</button>
      </div>
    );
  }

  if(presaleStarted && presaleEnded){
    return(
      <button className={styles.button} onClick ={publicMint}>Public Mint 🚀</button>
    );
  }
};

return (
  <div>
    <Head>
      <title>Crypto Devs</title>
      <meta name="description" content="Whitelist-Dapp" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
        <div className={styles.description}>
          Its an NFT collection for developers in Crypto.
        </div>
        <div className={styles.description}>
          {tokenIdsMinted}/20 have been minted
        </div>
        {RenderButton()}
      </div>
      <div>
        <img className={styles.image} src="./cryptodevs/0.svg" />
      </div>
    </div>

    <footer className={styles.footer}>
      Made with &#10084; by Crypto Devs
    </footer>
  </div>
);
}