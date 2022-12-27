import React, { useRef, useState, useEffect } from "react";
import { Contract, providers, BigNumber } from "ethers";
import { abi } from "../constants/CrytoDevMetadata.json";
import { abi as NFtAbi } from "../constants/NFTCollectionMetadata.json";
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
      alert("Please change network to goerli or polygon");
      throw new Error("Please change network to goerli or polygon");
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
      const tokenContract = await getSignerConnectedContract();
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
          const tokenId = await nftContract.tokenOfOwnerByIndex(ownerAddress, i);
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

  return <div>hello world </div>;
}
