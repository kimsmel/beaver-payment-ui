import { Modal, Spinner } from "react-bootstrap";

import React from "react";

interface LoadingProps {
    loading: boolean;
    onHide?: () => void;
}

class Loading extends React.Component<LoadingProps> {
    render() {
        return (
            <Modal show={this.props.loading} onHide={this.props.onHide} centered>
                <Modal.Body>
                    <div className="text-center">
                        <Spinner animation="border" variant="primary" />
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}

export default Loading;