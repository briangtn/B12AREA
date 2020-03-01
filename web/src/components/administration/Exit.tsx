import React, { Component } from 'react';

interface Props {
    history: {
        push: any
    }
}

interface State {}

/**
 * React component that redirect to the:
 *          - / route
 */
class Exit extends Component<Props, State> {
    componentDidMount() {
        this.props.history.push('/');
    }

    render() {
        return (
            <div>

            </div>
        );
    }
}

export default Exit;
