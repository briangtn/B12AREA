import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Avatar from '@material-ui/core/Avatar';

import { red } from '@material-ui/core/colors';

import PersonIcon from '@material-ui/icons/Person';

interface Props {
    apiUrl: string,
    token: string,
    classes: {
        avatar: string
    }
}

interface State {
    accountNumber: number
}

const styles = (theme: Theme) => createStyles({
    avatar: {
        backgroundColor: red[500]
    }
});

class Account extends Component<Props, State> {
    state: State = {
        accountNumber: 0
    };

    componentDidMount() {
        const { apiUrl, token } = this.props;

        fetch(`${apiUrl}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then((data) => {
                this.setState({ accountNumber: data.length });
            })
    }

    render() {
        const { classes } = this.props;

        return (
            <Card>
                <CardHeader
                    avatar={
                        <Avatar aria-label="recipe" className={classes.avatar}>
                            <PersonIcon />
                        </Avatar>
                    }
                    title={`${this.state.accountNumber} accounts registered`}
                />
            </Card>
        )
    }
}

export default withStyles(styles)(Account);
