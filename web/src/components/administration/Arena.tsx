import React, { Component } from 'react';

interface Props {}

interface State {}

/**
 * React component who opens a new window on ARENA
 * if the environment variable exists.
 */
class Arena extends Component<Props, State> {
    componentDidMount() {
        if (process.env.REACT_APP_ARENA_URL)
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
