import React from "react";

import "./DarkPage.css";
import { Alert, Button, Form } from "react-bootstrap";

import IconCopy from "../assets/icons/copy-white.svg";
import { QRCodeCanvas } from "qrcode.react";
import Loading from "../components/Loading/Loading";
import SuccessIcon from "../assets/icons/success.svg";
import WarningIcon from "../assets/icons/warning.svg";
import { API } from "../api/api";
import { ChainType } from "../models/ChainType";
import { PaymentOrder } from "../models/PaymentOrder";
import copy from "copy-to-clipboard";
import toast, { Toaster } from 'react-hot-toast';
import ExceptionForm from "../components/ExceptionForm/ExceptionForm";
import Header from "../components/Header/Header";
import { useTranslation } from "react-i18next";
import { t } from "i18next";
import Footer from "../components/Footer/Footer";
import PayByWallet from "../components/PayByWalletButton/PayByWalletButton";
import Divider from "../components/Divider/Divider";


interface DarkPageProps {
    id: string;
    i18n: any;
    t: any;
}

interface DarkPageState {
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

    showException: boolean;
}

interface CustomWindow extends Window {
    flutter_inappwebview?: {
        callHandler: (handlerName: string, result: boolean) => Promise<void>;
    };
}

declare let window: CustomWindow;

class DarkPageComponent extends React.Component<DarkPageProps, DarkPageState> {
    constructor(props: DarkPageProps) {
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
            showException: false

        };
    }

    _countdown = () => {
        const { t } = this.props;
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
                    warning: t('The order has expired or closed.'),
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
        const { t } = this.props;
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
                        warning: t('The order has been closed.'),
                        disabled: true
                    });
                    this._clearAllTimers();
                } else if (o.status === 'EXPIRED') {
                    this.setState({
                        warning: t('The order has expired.'),
                        disabled: true
                    });
                    this._clearAllTimers();
                } else {
                    const expireSeconds = Math.floor((o.expiredAt - Date.now()) / 1000);
                    if (expireSeconds <= 0) {
                        this._clearAllTimers();
                        this.setState({
                            warning: t('The order has expired.'),
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
        const { t } = this.props;
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
                            warning: t('The order has expired or closed.'),
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
                warning: t('The order does not exist.'),
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

        const { t } = this.props;

        if (response.ok) {
            const data = await response.json();
            if (data['code'] === 1) {
                this.setState({
                    chains: data['data'],
                });
            } else {
                this.setState({
                    warning: t('No chain available.'),
                });
            }
        } else {
            this.setState({
                warning: t('No chain available.'),
                disabled: true
            });
        }
    }

    _loadBalance = async (uid: string) => {
        const { t } = this.props;
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
                    warning: t('No balance available.'),
                });
            }
        } else {
            this.setState({
                warning: t('No balance available.'),
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

        const { t } = this.props;

        if (response.ok) {
            const data = await response.json();
            if (data['code'] === 1) {
                this.setState({
                    addresses: data['data'],
                });
            } else {
                this.setState({
                    warning: t('No wallet available.'),
                });
            }
        } else {
            this.setState({
                warning: t('No wallet available.'),
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
                warning: t('Failed to pay with balance.'),
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
        // console log current i18n code
        console.log(this.props.i18n.language);
        if (this.props.id === '') {
            this.setState({
                warning: t('The order does not exist.'),
                disabled: true
            });
        } else {
            this._loadData();
        }

    }

    render() {
        const { t } = this.props;
        return (
            <div className="wrapper">
                <Header t={t} i18n={this.props.i18n} />
                <div className="">
                    <div className="upay-page" >

                        {this.state.warning && !this.state.success ? <div className="upay-container">
                            <Alert variant="warning flex align-center">
                                <img src={WarningIcon} alt="warning" className="icon-sm margin-right" />
                                {this.state.warning}
                            </Alert>
                        </div> : null}
                        {this.state.success ? <div className="upay-container">
                            <Alert variant="success" className="align-center flex flex-wrap">
                                <img src={SuccessIcon} alt="success" className="icon-sm margin-right" />
                                {t('Thank you for your payment. The order has been paid successfully.')}
                                {this.state.order?.redirectUrl && !this.isInApp() ? <span>{t('If the page does not jump automatically, please')}  <Alert.Link href={
                                    this.state.order.redirectUrl
                                }>{t('click here')}</Alert.Link></span>
                                    : null}
                                {this.isInApp() ? <span><Alert.Link
                                    onClick={() => {
                                        if (window.flutter_inappwebview) {
                                            window.flutter_inappwebview.callHandler('popPage', true)
                                                .then(function (result) {
                                                    console.log("Page closed");
                                                });
                                        }
                                    }}
                                >Click to close</Alert.Link></span> : null}
                            </Alert>
                        </div> : null}
                        <div className="upay-container">
                            <div className="upay-body">

                                <div className="upay-body-left" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                }}>
                                    <div>
                                        <div className="count-down-text text-center" style={{
                                            marginTop: '1rem',
                                            marginBottom: '1rem'
                                        }}>
                                            {this.state.timeRemains}
                                        </div>

                                        <div className="main-price text-center" style={{
                                            lineHeight: 1,
                                        }}>
                                            ${
                                                this.state.order ? this.state.order.amount : 'Loading...'
                                            }
                                        </div>
                                        <div style={{
                                            marginTop: '2rem'
                                        }}>
                                        </div>

                                        {this.state.order && this.state.order.logo ? <div className="upay-item-image">
                                            <img alt="" src={
                                                this.state.order ? this.state.order.logo : ''
                                            } />
                                        </div> : null}
                                        <div style={{
                                            height: '2rem'
                                        }}></div>
                                    </div>
                                    <div>
                                        <Divider title="ORDER"/>
                                        <div>
                                            <div className="upay-info-item flex justify-between">
                                                <div>ID</div>
                                                <div># {
                                                    this.state.order ? this.state.order.id : 'Loading...'
                                                }</div>
                                            </div>
                                            <div className="upay-info-item flex justify-between">
                                                <div>{t('Order ID')}</div>
                                                <div># {
                                                    this.state.order ? this.state.order.oid : 'Loading...'
                                                }</div>
                                            </div>
                                            <div className="upay-info-item flex justify-between">
                                                <div>{t('Memo')}</div>
                                                <div>
                                                    {this.state.order ? this.state.order.memo : 'Loading...'}
                                                </div>
                                            </div>

                                        </div>
                                        {/* amount */}
                                        <div>
                                            <hr />
                                            <div className="upay-info-item  flex justify-between">
                                                <div className="upay-info-item-label">{t('Amount')}</div>
                                                <div className="price bold ">
                                                    ₮ {
                                                        this.state.order ? this.state.order.amount : 'Loading...'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        {/* balance remain */}
                                        <div>
                                            <div className="upay-info-item  flex justify-between">
                                                <div className="upay-info-item-label">{t('Balance')}</div>
                                                <div className="text-grey">
                                                    ₮ {this.state.balance}
                                                </div>
                                            </div>
                                        </div>
                                        {/* pay button */}
                                        {!(this.state.disabled
                                            || this.state.balance === 0
                                            || this.state.balance < (this.state.order?.amount || 0)) ? <div className="text-right d-grid gap-2">
                                            <Button variant="primary"
                                                onClick={() => {
                                                    this._doPayWithBalance();
                                                }
                                                } className="pay-button margin"
                                                size="lg"
                                            >
                                                {t('Pay with Balance')}
                                            </Button>
                                        </div> : null}
                                    </div>
                                </div>
                                <div className="upay-body-middle"></div>

                                {this.state.balance === 0
                                    || this.state.balance < (this.state.order?.amount || 0) ? <div className="upay-body-right">
                                    {window.ethereum ? <div>
                                        {this.state.chains && this.state.chains.length > 0 ?
                                            <PayByWallet title={t('Pay with wallet')}
                                                amount={this.state.order?.amount || 0}
                                                chainTypes={this.state.chains}
                                                depositAddressMap={this.state.addresses}
                                                onLoading={(show) => {
                                                    this.setState({
                                                        loading: show
                                                    });
                                                }}
                                                onError={(e) => {
                                                    this.setState({
                                                        loading: false,
                                                    });
                                                }}
                                                onSuccess={() => {
                                                    this.setState({
                                                        loading: false,
                                                    });
                                                }}
                                            /> : null}
                                        <Divider title={t('Or transfer token directly')} />
                                    </div> : null}
                                    <div className="upay-info-item-label text-gray">
                                        {t('Select Network')}
                                    </div>
                                    <div className="margin-top-sm">
                                        <Form.Select aria-label="Select a network" onChange={(e) => {
                                            this.setState({
                                                currentChain: parseInt(e.target.value)
                                            });
                                        }} style={{
                                            backgroundColor: '#313950',
                                        }}>
                                            {this.state.chains.map((chain, index) => {
                                                return <option key={index} value={index}>{chain.chainName}</option>
                                            })}
                                        </Form.Select>
                                        <Form.Text className="text-muted text-sm">
                                            {this.state.chains.length > 0 ? this.state.chains[this.state.currentChain].descriptionMap[
                                                this.props.i18n.language
                                            ] : 'Loading...'}
                                        </Form.Text>
                                    </div>
                                    <div className="margin-top">
                                        <Alert variant="secondary" className="align-center flex justify-between word-break text-sm flex-wrap">
                                            <div> {
                                                this.state.addresses && this.state.chains.length > 0 ? this.state.addresses[this.state.chains[this.state.currentChain].chainType] : 'Loading...'
                                            }</div>
                                            <img src={IconCopy} alt="copy" className="pointer icon-sm" onClick={() => {
                                                //
                                                if (this.state.addresses && this.state.chains.length > 0) {
                                                    //navigator.clipboard.writeText(this.state.addresses[this.state.chains[this.state.currentChain].chainType]);
                                                    copy(this.state.addresses[this.state.chains[this.state.currentChain].chainType]);
                                                    toast('Copied to clipboard', {
                                                        duration: 1000,
                                                    });
                                                }
                                            }} />
                                        </Alert>
                                    </div>
                                    <div className="upay-qrcode-wrap flex justify-center margin-top">
                                        {this.state.addresses && this.state.chains.length &&
                                            (/^0x[a-fA-F0-9]{40}$/.test(this.state.addresses[this.state.chains[this.state.currentChain].chainType])
                                                || /^T[a-zA-Z0-9]{33}$/.test(this.state.addresses[this.state.chains[this.state.currentChain].chainType])
                                            )
                                            ? <div id="qrCode">
                                                <QRCodeCanvas
                                                    value={
                                                        this.state.addresses && this.state.chains.length > 0 ? this.state.addresses[this.state.chains[this.state.currentChain].chainType] : ''
                                                    }
                                                    size={140}
                                                    level="H"
                                                />
                                                {/* cover the qrcode  */}
                                                <div className="upay-qrcode-cover" style={{ display: this.state.success ? 'block' : 'none' }}>
                                                    {/* icon */}
                                                    <div className="upay-qrcode-icon text-center">
                                                        <img src={SuccessIcon} alt="success" />
                                                    </div>
                                                </div>
                                            </div> : null}

                                    </div>

                                    {!this.state.disabled ? <div className="text-sm text-center text-gray margin-top">
                                        {t('Please transfer the amount to the above address.')}
                                    </div> : <div className="text-sm text-center text-danger">
                                        {this.state.success ? t('The payment has been completed.') : t('The payment has been expired or closed.')}
                                    </div>}

                                </div> : <div className="upay-body-right">

                                    <div className="text-sm text-gray border margin-top">
                                        {t('With balance')}
                                    </div>

                                </div>}
                                {/* end of body right */}

                            </div>
                            <div style={{
                                textAlign: 'right',
                                fontSize: '0.8rem',
                                marginTop: '1rem',
                                color: '#6ea8fe',
                                cursor: 'pointer'
                            }}>
                                <div onClick={(e) => {
                                    e.preventDefault();
                                    this.setState({
                                        showException: true
                                    });
                                }}>
                                    {t('Funds not received?')}
                                </div>
                            </div>
                        </div>
                        <Loading loading={this.state.loading} />
                        <Toaster />
                        <ExceptionForm chains={this.state.chains} show={this.state.showException} onClose={() => {
                            this.setState({
                                showException: false
                            });
                            this._loadData();
                        }} onError={(e) => {
                            this.setState({
                                warning: e,
                            });
                        }} i18n={this.props.i18n} t={t} />
                    </div>
                </div>
                <Footer />
            </div>
        );
    }
}


export const DarkPage = (props: any) => {
    const { t, i18n } = useTranslation();
    const id = new URLSearchParams(window.location.search).get('id') || ''
    // if local storage has not language, set it to en
    if (!localStorage.getItem('language')) {
        // set it to system language
        localStorage.setItem('language', i18n.language);
    }
    return <DarkPageComponent id={id} i18n={i18n} t={t} />
}