import { Modal } from "react-bootstrap";
import "./ErrorMessage.css";
import React from "react";

interface ErrorMessageProps {
    message: string;
    show: boolean;
}

class ErrorMessage extends React.Component<ErrorMessageProps> {
    render() {
        return (
            <Modal show={this.props.show} onHide={() => {}}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="error-message">
                        {this.props.message}
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}

export default ErrorMessage;