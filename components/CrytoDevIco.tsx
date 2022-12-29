import React, { useRef, useState, useEffect } from "react";
import { Contract, providers, BigNumber, utils } from "ethers";
import { abi } from "../constants/CrytoDevMetadata.json";
import { abi as NFtAbi } from "../constants/NFTCollectionMetadata.json";
import styles from "../styles/Home.module.css"
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  crytoDevGoerliAddress,
  goerliIcoAddress,
  polygonIcoAddress,
} from "../constants/index";
import Web3Modal from "web3modal";

type Props = {};

export default function CrytoDevIco({}: Props) {
  // Create a BigNumber `0`
  const zero = BigNumber.from(0);
  // walletConnected keeps track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState<boolean>(false);
  // tokensToBeClaimed keeps track of the number of tokens that can be claimed
  // based on the Crypto Dev NFT's held by the user for which they havent claimed the tokens
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState<BigNumber>(zero);
  // balanceOfCryptoDevTokens keeps track of number of Crypto Dev tokens owned by an address
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =
    useState<BigNumber>(zero);
  // amount of the tokens that the user wants to mint
  const [tokenAmount, setTokenAmount] = useState<BigNumber>(zero);
  // tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)
  const [tokensMinted, setTokensMinted] = useState<BigNumber>(zero);
  // isOwner gets the owner of the contract through the signed address
  const [isOwner, setIsOwner] = useState<boolean>(false);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
 
  
  const web3ModalRef = useRef<any>();
  const getProviderAndSigner = async (): Promise<{
    provider: providers.Web3Provider;
    signer: providers.JsonRpcSigner;
  }> => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();

    if (chainId !== 5) {
      alert("Please change network to goerli ");
      throw new Error("Please change network to goerli");
    }
    const signer = web3Provider.getSigner();
    return { provider: web3Provider, signer };
  };

  // To use the function, you can do the following:

  const getSignerConnectedContract = async (): Promise<Contract> => {
    const { provider, signer } = await getProviderAndSigner();
    const signerConnectedContract = new Contract(goerliIcoAddress, abi, signer);
    return signerConnectedContract;
  };

  const getNftProviderConnectedContract = async (): Promise<Contract> => {
    const { provider, signer } = await getProviderAndSigner();
    const signerConnectedContract = new Contract(
      crytoDevGoerliAddress,
      abi,
      provider
    );
    return signerConnectedContract;
  };

  const getProviderConnectedContract = async (): Promise<Contract> => {
    const { provider, signer } = await getProviderAndSigner();
    const providerConnectedAccount = new Contract(
      goerliIcoAddress,
      abi,
      provider
    );
    return providerConnectedAccount;
  };

  const getTokensToBeClaimed = async () => {
    const { provider, signer } = await getProviderAndSigner();
    try {
      //To get the NFT contract instance
      const nftContract = await getNftProviderConnectedContract();
      //To get the Token contract instance
      const tokenContract = await getProviderConnectedContract();
      //To get the msg.sender address
      const ownerAddress = await signer.getAddress();
      //Since this contract inherits from the ERC721 standard it automatically get the balnaceOf function
      const balance = await nftContract.balanceOf(ownerAddress);

      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        // amount keeps track of the number of unclaimed tokens
        var amount = 0;
        // For all the NFT's, check if the tokens have already been claimed
        // Only increase the amount if the tokens have not been claimed
        // for a an NFT(for a given tokenId)
        for (var i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(
            ownerAddress,
            i
          );
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        //tokensToBeClaimed has been initialized to a Big Number, thus we would convert amount
        // to a big number and then set its value
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (e: unknown) {
      console.log(e);
      setTokensToBeClaimed(zero);
    }
  };

  //This function gets the balance of the tokens that the signer address has
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      // Using a single function to get the signer or provider
      const { provider, signer } = await getProviderAndSigner();
      //To create an instance of the contract connected to the provider
      const tokenContract = await getProviderConnectedContract();
      //To get the address of the msg.sender
      const ownerAddress = await signer.getAddress();
      //To the get the number of tokens that has been mined for that address
      const balance = await tokenContract.balanceOf(ownerAddress);
      setBalanceOfCryptoDevTokens(balance);
    } catch (e: unknown) {
      console.log(e);
      setBalanceOfCryptoDevTokens(zero);
    }
  };

  //This function get the number of CryptoDev token that is in existence
  const getTotalTokensMinted = async () => {
    try {
      // Using a single function to get the signer or provider
      const { provider, signer } = await getProviderAndSigner();
      //To create an instance of the contract connected to the provider
      const tokenContract = await getProviderConnectedContract();
      //To get the number of Token that has been minted
      const _tokenMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokenMinted);
    } catch (e: unknown) {
      console.log(e);
    }
  };

  //This function helps to mint the CryptoDev's Token depending on the amount that is wanted
  const mintCryptoDevToken = async (amount: number) => {
    try {
      // Using a single function to get the signer or provider
      const { provider, signer } = await getProviderAndSigner();
      //To create an instance of the contract connected to the signer
      const tokenContract = await getSignerConnectedContract();
      //This calculation is the same with one in the smart contract
      const value = 0.001 * amount;
      //This to perform the transaction
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });
      //To change the state of the button if the transaction has started
      setLoading(true);
      await tx.wait();
      //To change the state of the button if the transaction is over
      setLoading(false);
      alert("🎉 Successfully minted CryptoDev's token 🎉");
      await getTokensToBeClaimed();
      await getTotalTokensMinted();
      await getBalanceOfCryptoDevTokens();
    } catch (e: unknown) {
      console.log(e);
    }
  };

  //This function allows an address to claim their tokens
  const claimCryptoDevTokens = async () => {
    try {
      // Using a single function to get the signer or provider
      const { provider, signer } = await getProviderAndSigner();
      //To create an instance of the contract connected to the signer
      const tokenContract = await getSignerConnectedContract();
      //This function is use to claim the tokens
      const tx = await tokenContract.claim();
      //To change the state of the button if the transaction has started
      setLoading(true);
      await tx.wait();
      //To change the state of the button if the transaction is over
      setLoading(false);
      alert("🎉 CryptoDev's contract has successfully been Claimed 🎉");
      await getTokensToBeClaimed();
      await getTotalTokensMinted();
      await getBalanceOfCryptoDevTokens();
    } catch (e: unknown) {
      console.log(e);
    }
  };

  //This function allows you to setIsOwner state to true if the owner === signer address
  const getOwner = async () => {
    try {
      // Using a single function to get the signer or provider
      const { provider, signer } = await getProviderAndSigner();
      //To create an instance of the contract connected to the provider
      const tokenContract = await getProviderConnectedContract();
      //This retrieves the deployer of the smart contract
      const _ownerAddressFromContract = await tokenContract.owner();
      const ownerAddress = await signer.getAddress();
      //This checks if the owner address === to the signer's address
      if (
        _ownerAddressFromContract.toLowerCase() === ownerAddress.toLowerCase()
      ) {
        setIsOwner(true);
      }
    } catch (e: unknown) {
      console.log(e);
    }
  };

  //This function allows only the deployer of the smart contract to withdraw from the smart contract
  const withdrawCoins = async () => {
    try {
      // Using a single function to get the signer or provider
      const { provider, signer } = await getProviderAndSigner();
      //To create an instance of the contract connected to the provider
      const tokenContract = await getSignerConnectedContract();
      //function to withdraw from the smart contract
      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      //To change the state of the button if the transaction is over
      setLoading(false);
      alert("🎉 CryptoDev's funds has been successfully withdrawn 🎉");
      await getOwner()
    } catch (e: unknown) {
      console.log(e);
      alert(e)
    }
  };

  const connectWallet = async () => {
   try {
     // Get the provider from web3Modal, which in our case is MetaMask
     // When used for the first time, it prompts the user to connect their wallet
      const {provider,signer} = await getProviderAndSigner()
     
     setWalletConnected(true);
   } catch (err) {
     console.error(err);
   }
 };


  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      getOwner();
    }
  }, [walletConnected]);


  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed.toNumber() > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed.toNumber() * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }} >
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={`${styles.input} text-black`}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > BigNumber.from(0))}
          onClick={() => mintCryptoDevToken(tokenAmount.toNumber())}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 text-white">
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto
                Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
              </div>
              {renderButton()}
              {/* Display additional withdraw button if connected wallet is owner */}
                {isOwner ? (
                  <div>
                  {loading ? <button className={styles.button}>Loading...</button>
                           : <button className={styles.button} onClick={withdrawCoins}>
                               Withdraw Coins
                             </button>
                  }
                  </div>
                  ) : ("")
                }
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}

