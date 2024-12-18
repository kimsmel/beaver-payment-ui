import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import './PayByWalletButton.css';

// import MetamaskIcon from '../../assets/icons/metamask.svg';
// import CoinbaseWalletIcon from '../../assets/icons/coinbase.svg';
// import WalletConnectIcon from '../../assets/icons/walletconnect.svg';
import { ChainType, UsdtContract } from '../../models/ChainType';
import { BrowserProvider, ethers } from 'ethers';
import Divider from '../Divider/Divider';

import TPIcon from '../../assets/icons/tp.png';
import OKXIcon from '../../assets/icons/okx.svg';

declare global {
    interface Window {
        ethereum: any;
        web3: any;
    }
}

interface PayByWalletProps {
    title: string;
    amount: number;
    chainTypes: ChainType[];
    depositAddressMap: any;
    onSuccess?: (amount: number, to: string) => void;
    onLoading?: (show: boolean) => void;
    onError?: (error: string) => void;
}

interface PayByWalletState {
    show: boolean;
    connected: boolean;
    provider: BrowserProvider | undefined;
    usdtContract: UsdtContract | undefined;
    chain: ChainType | undefined;
    error: string | undefined;
}

class PayByWallet extends React.Component<PayByWalletProps, PayByWalletState> {

    constructor(props: PayByWalletProps) {
        super(props);
        this.state = {
            show: false,
            connected: false,
            provider: undefined,
            usdtContract: props.chainTypes[0].usdtContracts[0],
            chain: props.chainTypes[0],
            error: undefined
        }

        // console props
        console.log(this.props);
    }

    componentDidMount(): void {
        if (window.ethereum) {
            window.ethereum.on('chainChanged', (chainId: string) => {
                console.log('chainChanged', chainId);
                const chain = this.props.chainTypes.find((chainType) => chainType.chainId === Number(chainId));
                if (chain) {
                    this.setState({
                        chain: chain,
                        usdtContract: chain.usdtContracts[0]
                    });
                }
            });

            const provider = new BrowserProvider(window.ethereum);
            provider.getNetwork().then((network) => {
                const chain = this.props.chainTypes.find((chainType) => chainType.chainId === Number(network.chainId));
                if (chain) {
                    this.setState({
                        chain: chain,
                        usdtContract: chain.usdtContracts[0]
                    });
                }
            });
        }
    }

    toEIP55 = (address: string) => {
        if (address.startsWith('0x')) {
            return ethers.getAddress(address);
        } else {
            return address;
        }
    }

    doConnect = async () => {
        try {
            this.setState({
                error: undefined
            })
            if (!window.ethereum) {
                this.setState({
                    error: "Please install Metamask first."
                });
                return;
            }

            // if chain is not selected
            if (!this.state.chain) {
                this.setState({
                    error: "Please select chain first."
                });
                return;
            }

            // if usdt contract is not selected
            if (!this.state.usdtContract) {
                this.setState({
                    error: "Please select currency first."
                });
                return;
            }

            // if usdt contract not starts with 0x
            if (!this.state.usdtContract.address.startsWith('0x')) {
                this.setState({
                    error: "Not supported yet."
                });
                return;
            }

            const provider = new BrowserProvider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            const network = await provider.getNetwork();
            const chainId = network.chainId;

            // if chain is not same
            const chainIdSelected = this.state.chain.chainId ?? 0;

            if (chainIdSelected !== Number(chainId)) {
                await this.switchChain(chainIdSelected);
            }

            this.doPay(provider, this.state.usdtContract);
        } catch (e: Error | any) {
            const msg = e.data ? (e.data.message || e.data.cause) : (e.reason || e.message);
            this.setState({
                error: msg
            });
            console.error(e);
        }
    }

    switchChain = async (chainId: number) => {
        return window.ethereum && window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [
                {
                    chainId: '0x' + chainId.toString(16)
                }
            ],

        })
    }

    doPay = async (provider: BrowserProvider, usdt: UsdtContract) => {
        // pay 
        const signer = await provider.getSigner();
        const usdtContract = new ethers.Contract(this.state.usdtContract?.address ?? "", [
            "function transfer(address to, uint256 amount) public returns (bool)",
            "function balanceOf(address owner) public view returns (uint256)"
        ], signer);

        const amount = ethers.parseUnits(this.props.amount.toString(), usdt.decimals ?? 6);
        const balance = await usdtContract.balanceOf(await signer.getAddress());
        if (balance < amount) {
            this.setState({
                error: "Insufficient balance."
            });
            return;
        }
        const chainType = this.state.chain?.chainType;

        const depositAddress = this.props.depositAddressMap[chainType ?? ""];
        if (!depositAddress) {
            this.setState({
                error: "Deposit address not found."
            });
            return;
        }

        this.props.onLoading?.(true);

        try {
            const tx = await usdtContract.transfer(depositAddress, amount);
            await tx.wait(1);
            this.props.onSuccess?.(this.props.amount, depositAddress);
        } catch (e: Error | any) {
            const msg = e.data ? (e.data.message || e.data.cause) : (e.reason || e.message);
            this.setState({
                error: msg
            });
            this.props.onError?.(msg);
        }
    }

    render() {
        const { error } = this.state;
        return (
            <div className='d-grid gap-2'>
                {window.ethereum ? <Button variant="success" size="lg" className='pay-button' onClick={
                    () => {
                        this.setState({
                            show: true
                        });
                    }
                }>{this.props.title}</Button> : null}
                <Modal show={this.state.show}>
                    <Modal.Header>
                        <Modal.Title>{
                            this.props.title
                        }</Modal.Title>
                        <button type="button" className="btn-close" onClick={
                            () => {
                                this.setState({
                                    show: false,
                                    error: undefined
                                });
                            }
                        }></button>
                    </Modal.Header>
                    <Modal.Body>
                        {/* error message */}
                        {error ? <div className="error">
                            {error}
                        </div> : null}
                        <div className="flex walletWrapper">
                            {/* chainTypes */}
                            <div>
                                {
                                    this.props.chainTypes.map((chainType, index) => {
                                        return (
                                            chainType.chainName !== 'TRON' ? <div key={index} className={
                                                this.state.chain?.chainId === chainType.chainId ? "chainItem active" : "chainItem"
                                            } onClick={
                                                async () => {
                                                    this.props.onLoading?.(true);
                                                    this.setState({
                                                        chain: chainType,
                                                        error: undefined
                                                    });
                                                    // is chain id changed ?
                                                    if (chainType.chainId !== this.state.chain?.chainId) {
                                                        this.setState({
                                                            usdtContract: chainType.usdtContracts[0]
                                                        });
                                                        await this.switchChain(chainType.chainId ?? 0);
                                                    }
                                                    this.props.onLoading?.(false);
                                                }
                                            }>
                                                <div>{chainType.chainName}</div>
                                            </div> : <div key={index} ></div>
                                        );
                                    })
                                }
                            </div>
                            <div className="currencyPanel">
                                {/* if chain show usdt contracts  */}
                                {
                                    this.state.chain !== undefined && this.state.chain.usdtContracts !== undefined && this.state.chain.usdtContracts.map((usdtContract, index) => {
                                        return (
                                            <div key={index} className={
                                                this.state.usdtContract?.address === usdtContract.address ? "currencyItem active" : "currencyItem"
                                            } onClick={
                                                () => {
                                                    this.setState({
                                                        usdtContract: usdtContract
                                                    });
                                                }
                                            }>
                                                <img src={"https://raw.githubusercontent.com/WhiteRiverBay/icons/refs/heads/main/icons/" + this.toEIP55(
                                                    usdtContract.address
                                                ) + ".svg"} alt={usdtContract.symbol} />
                                                <div>{usdtContract.symbol}</div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                        <Divider title="Select Wallet" />
                        <div>
                            <div className="walletItem flex" onClick={() => {
                                this.doConnect();
                            }}>
                                <div>
                                    Checkout
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: '0.2rem'
                                }}>
                                    <img src="https://metamask.io/assets/icon.svg" alt="Metamask" />
                                    {/* tpicon */}
                                    <img src={TPIcon} alt="tp" />
                                    <img src={OKXIcon} alt="okx" />
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                </Modal>


            </div>
        );
    }
}

export default PayByWallet;