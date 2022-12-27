import React,{useRef,useState,useEffect} from 'react'
import {Contract,providers,BigNumber} from "ethers"
import {abi} from "../constants/CrytoDevMetadata.json"
import {goerliIcoAddress,polygonIcoAddress} from "../constants/index"

type Props = {}

export default function CrytoDevIco({}: Props) {
 
 const web3ModalRef = useRef<any>();
 const getProviderAndSigner = async (): Promise<{ provider: providers.Web3Provider, signer: providers.JsonRpcSigner }> => {
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
  const {provider,signer} = await getProviderAndSigner();
  const signerConnectedContract = new Contract(
   goerliIcoAddress,
    abi,
    signer
  );
  return signerConnectedContract;
};

const getProviderConnectedContract = async (): Promise<Contract> => {
  const {provider,signer} = await getProviderAndSigner();
  const providerConnectedAccount = new Contract(
   goerliIcoAddress,
    abi,
    provider
  );
  return providerConnectedAccount;
};

  return (
    <div>hello world </div>
  )
}