import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Avatar from '@material-ui/core/Avatar';
import { red, green, blue } from '@material-ui/core/colors';
import Clock from "../Clock";

import PersonIcon from '@material-ui/icons/Person';
import AccessTimeIcon from '@material-ui/icons/AccessTime';

import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import CardContent from "@material-ui/core/CardContent";

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
        const currentDate: Date = new Date();
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        return (
            <div>
                <Grid container spacing={3}>
                    <Grid item xs={4}>
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
                    </Grid>
                    <Grid item xs={4}>
                        <Card className={classes.root}>
                            <CardHeader
                                avatar={
                                    <Avatar aria-label="recipe" style={{backgroundColor: green[500]}}>
                                        <AccessTimeIcon />
                                    </Avatar>
                                }
                                title={`${days[currentDate.getDay()]} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                            />
                            <CardContent style={{ textAlign: 'center' }}>
                                <Typography variant="h2" gutterBottom><Clock /></Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </div>
        );
    }
}

export default withStyles(styles)(Summary);
