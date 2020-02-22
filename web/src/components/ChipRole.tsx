import React, { Component } from 'react';

import Chip from '@material-ui/core/Chip';

interface Props {
    role: string,
    size: "small" | "medium"
}

interface State {
    color: Color[]
}

interface Color {
    roleName: string,
    color: string
}

class ChipRole extends Component<Props, State> {
    state: State = {
        color: [
            { roleName: "admin", color: "#e74c3c" },
            { roleName: "user", color: "#27ae60" },
            { roleName: "email_not_validated", color: "#f39c12" }
        ]
    };

    render() {
        const colorTuples: Color[] = this.state.color.filter((elem: Color) => elem.roleName === this.props.role);
        let linkedColor: string = '';

        if (colorTuples.length > 0) {
            linkedColor = colorTuples[0].color;
        }

        return (
            <Chip
                label={this.props.role}
                style={{backgroundColor: linkedColor, margin: '3px'}}
                size={this.props.size}
            />
        );
    }
}

export default ChipRole;