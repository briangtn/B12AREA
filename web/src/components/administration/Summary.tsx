import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import { red } from '@material-ui/core/colors';

import PersonIcon from '@material-ui/icons/Person';

interface Props {
    apiUrl: string,
    token: string,
    classes: {
        root: string,
        avatar: string
    }
}

interface State {
    accountNumber: number
}

const styles = (theme: Theme) => createStyles({
    root: {
        maxWidth: 345,
    },
    avatar: {
        backgroundColor: red[500],
    },
});

class Summary extends Component<Props, State> {
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
            <div>
                <Card className={classes.root}>
                    <CardHeader
                        avatar={
                        <Avatar aria-label="recipe" className={classes.avatar}>
                            <PersonIcon />
                        </Avatar>
                        }
                        title={`${this.state.accountNumber} accounts registered`}
                    />
                </Card>
            </div>
        );
    }
}

export default withStyles(styles)(Summary);
