import React from 'react';
import { Alert, Form, Modal } from 'react-bootstrap';
import { ChainType } from '../../models/ChainType';
import { API } from '../../api/api';


interface IExceptionFormProps {
    show: boolean;
    chains: ChainType[];
    onClose: () => void;
    onError: (error: string) => void;
}

interface IExceptionFormState {
    chain?: ChainType;
    txHash: string;
    error?: string;
    loading: boolean;
}

class ExceptionForm extends React.Component<IExceptionFormProps, IExceptionFormState> {
    constructor(props: IExceptionFormProps) {
        super(props);
        this.state = {
            chain: undefined,
            txHash: '',
            error: undefined,
            loading: false
        }
    }

    doSubmit = async () => {
        if (this.state.chain === undefined) {
            this.setState({
                error: 'Please select a chain'
            });
            return;
        }
        if (!/^0x[a-zA-Z0-9]{64}$/.test(this.state.txHash) && !/^[a-zA-Z0-9]{64}$/.test(this.state.txHash)) {
            this.setState({
                error: 'Invalid transaction hash'
            });
            return;
        }

        if (this.state.loading) {
            return;
        }

        // submit the tx hash
        this.setState({
            error: undefined,
            loading: true
        });

        // /api/v1/exception/hash
        const url = `${API}/api/v1/exception/hash`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chain: this.state.chain.chainName,
                txHash: this.state.txHash
            })
        });

        if (response.ok) {
            this.props.onClose();
        } else {
            const result = await response.json();
            this.props.onError(result.error);
        }

        this.setState({
            loading: false
        });

    }

    render() {
        return (
            <Modal show={this.props.show}>
                <Modal.Header>
                    Funds not received?
                    <button type="button" className="btn-close" onClick={this.props.onClose}></button>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant='info'>
                        <p>
                            If you have not received your funds, please submit the transaction hash of your deposit transaction. We will investigate and get back to you as soon as possible.
                        </p>
                    </Alert>
                    <Alert variant='danger' hidden={this.state.error === undefined}>
                        {this.state.error}
                    </Alert>
                    <div style={{
                        height: '1rem'
                    }}></div>
                    <Form>
                        <Form.Group>
                            <Form.Label>Select chain</Form.Label>
                            <Form.Select 
                                isInvalid={this.state.chain === undefined}
                                isValid={this.state.chain !== undefined}
                                onChange={(e) => {
                                const chainName = e.target.value;
                                const chain = this.props.chains.find((chain) => chain.chainName === chainName);
                                if (chain) {
                                    this.setState({
                                        chain: chain
                                    });
                                }
                            }}>
                                <option value="-1">Select a chain</option>
                                {
                                    this.props.chains.map((chain) => {
                                        return (
                                            <option key={chain.chainName} value={chain.chainName}>{chain.chainName}</option>
                                        );
                                    })
                                }
                            </Form.Select>
                        </Form.Group>
                        <div style={{
                            height: '1rem'
                        }}></div>
                        <Form.Group>
                            <Form.Label>Transaction Hash</Form.Label>
                            <Form.Control as="textarea" rows={2} placeholder='please enter the tx hash' onChange={(e) => {
                                this.setState({
                                    txHash: e.target.value
                                });
                            }} 
                                isValid={/^0x[a-zA-Z0-9]{64}$/.test(this.state.txHash) || /^[a-zA-Z0-9]{64}$/.test(this.state.txHash)}
                                isInvalid={!/^0x[a-zA-Z0-9]{64}$/.test(this.state.txHash) && !/^[a-zA-Z0-9]{64}$/.test(this.state.txHash)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="btn btn-primary">Submit</button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default ExceptionForm;