import React from "react";

import "./HomePage.css";
import { Alert, Button, Form } from "react-bootstrap";

import IconCopy from "../assets/icons/copy.svg";
import { QRCodeCanvas } from "qrcode.react";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Loading from "../components/Loading/Loading";
import SuccessIcon from "../assets/icons/success.svg";
import WarningIcon from "../assets/icons/warning.svg";
import { API } from "../api/api";
import { ChainType } from "../models/ChainType";
import { PaymentOrder } from "../models/PaymentOrder";
import copy from "copy-to-clipboard";
import toast, { Toaster } from 'react-hot-toast';


interface HomePageProps {
    id: string;
}

interface HomePageState {
    countdown: number;
    timeRemains: string;
    warning: string;
    orderPaid: boolean;
    loading: boolean;
    disabled: boolean;
    success: boolean;

    chains: ChainType[];
    order?: PaymentOrder;

    currentChain: number | 0;
    // map k,v 
    addresses?: any;
    // countdown timer
    countdownTimer?: NodeJS.Timer;
    // load project timer
    loadTimer?: NodeJS.Timer;

    balance: number;
}

interface CustomWindow extends Window {
    flutter_inappwebview?: {
        callHandler: (handlerName: string, result: boolean) => Promise<void>;
    };
}

declare let window: CustomWindow;

class HomePage extends React.Component<HomePageProps, HomePageState> {
    constructor(props: HomePageProps) {
        super(props);
        this.state = {
            countdown: 3599, // in seconds
            timeRemains: '--:--:--',
            warning: '',
            orderPaid: false,
            loading: false,
            disabled: false,
            success: false,

            chains: [],
            order: undefined,

            currentChain: 0,
            addresses: undefined,

            countdownTimer: undefined,
            loadTimer: undefined,

            balance: 0,

        };
    }

    _countdown = () => {
        if (this.state.countdownTimer) {
            clearInterval(this.state.countdownTimer);
        }
        const countdownTimer = setInterval(() => {
            if (this.state.countdown > 0) {
                this.setState({
                    countdown: this.state.countdown - 1,
                    timeRemains: this._formatTime(this.state.countdown)
                });
            } else {
                this.setState({
                    warning: 'The order has expired or closed.',
                    disabled: true
                });
                clearInterval(this.state.countdownTimer);
                this.setState({
                    countdownTimer: undefined
                });
            }
        }, 1000);

        this.setState({
            countdownTimer: countdownTimer
        });
    }

    // format time xx:xx:xx
    _formatTime = (time: number) => {
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time % 3600) / 60);
        let seconds = time % 60;

        return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }

    _loadData = async () => {
        this._loadChains();
        this._loadWallets();
        this._loadPaymentOrder();
        const loadTimer = setInterval(() => {
            this._loadPaymentOrderSilent();
        }, 5000);
        this.setState({
            loadTimer: loadTimer
        });
    }

    _clearAllTimers = () => {
        if (this.state.countdownTimer) {
            clearInterval(this.state.countdownTimer);
            this.setState({
                countdownTimer: undefined
            });
        }
        if (this.state.loadTimer) {
            clearInterval(this.state.loadTimer);
            this.setState({
                loadTimer: undefined
            });
        }

        this.setState({
            countdown: 0,
            timeRemains: '00:00:00'
        });
    }

    _loadPaymentOrderSilent = async () => {
        const api = `${API}/api/v1/order/${this.props.id}`;
        const response = await fetch(api, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data['code'] === 1) {
                this.setState({
                    order: data['data'],
                });
                const o = data['data'];
                if (o.status === 'PAID') {
                    this.setState({
                        success: true,
                        disabled: true
                    });
                    // if paid, clear timer, no need to countdown and load data
                    this._clearAllTimers();
                } else if (o.status === 'CLOSED') {
                    this.setState({
                        warning: 'The order has been closed.',
                        disabled: true
                    });
                    this._clearAllTimers();
                } else if (o.status === 'EXPIRED') {
                    this.setState({
                        warning: 'The order has expired.',
                        disabled: true
                    });
                    this._clearAllTimers();
                } else {
                    const expireSeconds = Math.floor((o.expiredAt - Date.now()) / 1000);
                    if (expireSeconds <= 0) {
                        this._clearAllTimers();
                        this.setState({
                            warning: 'The order has expired.',
                            disabled: true
                        });
                    } else {
                        this._loadBalance(o.uid);
                    }
                }
            } else {
                this.setState({
                    warning: data['msg'],
                    disabled: true
                });
            }
        }

    }

    _loadPaymentOrder = async () => {
        // simulate loading data
        this.setState({
            loading: true,
        });

        const api = `${API}/api/v1/order/${this.props.id}`;
        const response = await fetch(api, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data['code'] === 1) {
                this.setState({
                    order: data['data'],
                    loading: false,
                });
                const o = data['data'];
                const expireSeconds = Math.floor((o.expiredAt - Date.now()) / 1000);

                // clear timer
                if (this.state.countdownTimer) {
                    clearInterval(this.state.countdownTimer);
                    this.setState({
                        countdownTimer: undefined
                    });
                }

                if (o.status === 'PAID') {
                    this.setState({
                        success: true,
                        disabled: true
                    });
                    // if paid, clear timer, no need to countdown and load data
                    this._clearAllTimers();
                } else {
                    if (expireSeconds > 0) {
                        this.setState({
                            countdown: expireSeconds,
                            timeRemains: this._formatTime(expireSeconds)
                        }, () => {
                            this._countdown();
                        });
                        this._loadBalance(o.uid);
                    } else {
                        this.setState({
                            warning: 'The order has expired or closed.',
                            disabled: true
                        });
                        this._clearAllTimers();
                    }
                }
            } else {
                this.setState({
                    warning: data['msg'],
                    loading: false,
                    disabled: true
                });
            }
        } else {
            this.setState({
                warning: 'The order does not exist.',
                loading: false,
                disabled: true
            });
        }
    }

    _loadChains = async () => {

        const api = `${API}/api/v1/chains`;
        const response = await fetch(api, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data['code'] === 1) {
                this.setState({
                    chains: data['data'],
                });
            } else {
                this.setState({
                    warning: 'No chain available.',
                });
            }
        } else {
            this.setState({
                warning: 'No chain available.',
                disabled: true
            });
        }
    }

    _loadBalance = async (uid: string) => {
        const api = `${API}/api/v1/balance/${uid}`;
        const response = await fetch(api, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data['code'] === 1) {
                this.setState({
                    balance: data['data'],
                });
            } else {
                this.setState({
                    warning: 'No balance available.',
                });
            }
        } else {
            this.setState({
                warning: 'No balance available.',
                disabled: true
            });
        }
    }

    _loadWallets = async () => {

        const api = `${API}/api/v1/address/${this.props.id}`;
        const response = await fetch(api, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data['code'] === 1) {
                this.setState({
                    addresses: data['data'],
                });
            } else {
                this.setState({
                    warning: 'No wallet available.',
                });
            }
        } else {
            this.setState({
                warning: 'No wallet available.',
                disabled: true
            });
        }

    }

    _doPayWithBalance = async () => {
        if (!this.state.order) {
            return;
        }

        const api = `${API}/api/v1/pay/${this.state.order.id}`;
        const response = await fetch(api, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data['code'] === 1) {
                this.setState({
                    success: true,
                    disabled: true
                });
                // if paid, clear timer, no need to countdown and load data
                this._clearAllTimers();
            } else {
                this.setState({
                    warning: data['msg'],
                });
            }
        } else {
            this.setState({
                warning: 'Failed to pay with balance.',
            });
        }
    }

    isInApp = () => {
        const userAget = navigator.userAgent;
        if (userAget.indexOf('UPayInApp') > -1) {
            return true;
        } else {
            return false;
        }
    }

    componentDidMount() {
        if (this.props.id === '') {
            this.setState({
                warning: 'The order does not exist.',
                disabled: true
            });
        } else {
            this._loadData();
        }

    }

    render() {
        return (
            <div className="upay-page">
                <Header />
                {this.state.warning && !this.state.success ? <div className="upay-container  margin">
                    <Alert variant="warning flex align-center">
                        <img src={WarningIcon} alt="warning" className="icon" />
                        {this.state.warning}
                    </Alert>
                </div> : null}
                {this.state.success ? <div className="upay-container  margin-right">
                    <Alert variant="success" className="align-center flex flex-wrap margin">
                        <img src={SuccessIcon} alt="success" className="icon" />
                        The payment has been completed.
                        {this.state.order?.redirectUrl && !this.isInApp() ? <span>If the page does not jump automatically, please  <Alert.Link href={
                            this.state.order.redirectUrl
                        }>click here</Alert.Link></span>
                            : null}
                        {this.isInApp() ? <span><Alert.Link
                            onClick={() => {
                                if (window.flutter_inappwebview) {
                                    window.flutter_inappwebview.callHandler('popPage', true)
                                        .then(function(result) {
                                            console.log("Page closed");
                                        });
                                }
                            }}
                        >click to close</Alert.Link></span> : null}   
                    </Alert>
                </div> : null}
                <div className="upay-container">
                    <div className="upay-body">

                        <div className="upay-body-left">
                            <div>
                                <div className="upay-info-item">
                                    <div className="upay-info-item-label">ID</div>
                                    <div className="upay-info-item-text"># {
                                        this.state.order ? this.state.order.id : 'Loading...'
                                    }</div>
                                </div>
                                <div className="upay-info-item">
                                    <div className="upay-info-item-label">Order ID</div>
                                    <div className="upay-info-item-text large"># {
                                        this.state.order ? this.state.order.oid : 'Loading...'
                                    }</div>
                                </div>
                                <div className="upay-info-item">
                                    <div className="upay-info-item-label">Memo</div>
                                    <div className="upay-info-item-text">
                                        {this.state.order ? this.state.order.memo : 'Loading...'}
                                    </div>
                                </div>
                                <div className="upay-info-item">
                                    <div className="upay-info-item-label">Time remains</div>
                                    <div className="upay-info-item-text">{this.state.timeRemains}</div>
                                </div>
                            </div>
                            {/* amount */}
                            <div>
                                <hr />
                                <div className="upay-info-item">
                                    <div className="upay-info-item-label">Amount</div>
                                    <div className="price bold ">
                                        {
                                            this.state.order ? this.state.order.amount : 'Loading...'
                                        } USDT
                                    </div>
                                </div>
                            </div>
                            {/* balance remain */}
                            <div>
                                <div className="upay-info-item">
                                    <div className="upay-info-item-label">Balance</div>
                                    <div className="text-grey">
                                        {this.state.balance} USDT
                                    </div>
                                </div>
                            </div>
                            {/* pay button */}
                            <div className="text-right">
                                <Button variant="primary" size="sm"
                                    disabled={this.state.disabled
                                        || this.state.balance === 0
                                        || this.state.balance < (this.state.order?.amount || 0)}
                                    onClick={() => {
                                        this._doPayWithBalance();
                                    }
                                    }>
                                    Pay with balance
                                </Button>
                            </div>
                        </div>
                        <div className="upay-body-right">
                            <div className="upay-info-item-label">
                                Select a network
                            </div>
                            <div className="margin-top-sm">
                                <Form.Select aria-label="Select a network" onChange={(e) => {
                                    this.setState({
                                        currentChain: parseInt(e.target.value)
                                    });
                                }}>
                                    {this.state.chains.map((chain, index) => {
                                        return <option key={index} value={index}>{chain.chainName}</option>
                                    })}
                                </Form.Select>
                                <Form.Text className="text-muted text-sm">
                                    {this.state.chains.length > 0 ? this.state.chains[this.state.currentChain].description : 'Loading...'}
                                </Form.Text>
                            </div>
                            <div className="margin-top">
                                {!this.state.disabled ? <Alert variant="info" className="align-center flex justify-between word-break text-sm">
                                    <div> {
                                        this.state.addresses && this.state.chains.length > 0 ? this.state.addresses[this.state.chains[this.state.currentChain].chainType] : 'Loading...'
                                    }</div>
                                    <img src={IconCopy} alt="copy" className="pointer" onClick={() => {
                                        //
                                        if (this.state.addresses && this.state.chains.length > 0) {
                                            //navigator.clipboard.writeText(this.state.addresses[this.state.chains[this.state.currentChain].chainType]);
                                            copy(this.state.addresses[this.state.chains[this.state.currentChain].chainType]);
                                            toast('Copied to clipboard', {
                                                duration: 1000,
                                            });
                                        }
                                    }} />
                                </Alert> : null}
                            </div>
                            <Alert variant="light">
                                <div className="upay-qrcode-wrap">
                                    <div id="qrCode">
                                        {this.state.addresses && this.state.chains.length > 0 && !this.state.disabled ? <QRCodeCanvas
                                            value={
                                                this.state.addresses && this.state.chains.length > 0 ? this.state.addresses[this.state.chains[this.state.currentChain].chainType] : ''
                                            }
                                            size={180}
                                            level="H"
                                        /> : null}
                                        {/* cover the qrcode  */}
                                        <div className="upay-qrcode-cover" style={{ display: this.state.success ? 'block' : 'none' }}>
                                            {/* icon */}
                                            <div className="upay-qrcode-icon text-center">
                                                <img src={SuccessIcon} alt="success" />
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {!this.state.disabled ? <div className="text-sm text-center">
                                    You can also scan the QR code with your wallet.
                                </div> : <div className="text-sm text-center text-danger">
                                    {this.state.success ? 'The payment has been completed. ' : 'The payment has been expired or closed.'}
                                </div>}
                            </Alert>
                        </div>
                    </div>
                </div>
                <Loading loading={this.state.loading} />
                <Toaster />
                <Footer />
            </div>
        );
    }
}

export default HomePage;