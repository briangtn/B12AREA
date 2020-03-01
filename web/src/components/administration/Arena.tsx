import React, { Component } from 'react';

interface Props {}

interface State {}

class Arena extends Component<Props, State> {
    componentDidMount() {
        window.open(process.env.REACT_APP_ARENA_URL, '_blank');
    }

    render() {
        return (
            <div>
            </div>
        );
    }
}

export default Arena;
