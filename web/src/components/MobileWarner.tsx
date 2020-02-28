import React, { Component } from 'react';

import { connect } from 'react-redux';

import Typography from '@material-ui/core/Typography';

import {createStyles, Theme, withStyles} from "@material-ui/core";

import StayCurrentPortraitIcon from '@material-ui/icons/StayCurrentPortrait';

import Grid from '@material-ui/core/Grid';

const mapStateToProps = (state: any) => {
    return { language: state.language };
};

interface Props {
    language: string,
    classes: {
        root: string
    }
}

interface State {}

const styles = (theme: Theme) => createStyles({
    root: {
        width: '100%',
        backgroundColor: '#FFBE76',
        paddingTop: '2px'
    }
});

class MobileWarner extends Component<Props, State> {
    render() {
        const { classes, language } = this.props;
        const isMobile: boolean = window.innerWidth <= 500;

        if (isMobile) {
            return (
                <div className={classes.root}>
                    <Grid container spacing={3}>
                        <Grid item xs={2}>
                            <StayCurrentPortraitIcon />
                        </Grid>
                        <Grid item xs={10}>

                    {
                        (language === 'en')
                            ?
                            (
                                <Typography variant="body1" gutterBottom>
                                    Click <a style={{color: 'black'}} href="/client.apk" target="_blank">here</a> to download our app
                                </Typography>
                            )
                            :
                            (
                                <Typography variant="body1" gutterBottom>
                                    Cliquez <a style={{color: 'black'}} href="/client.apk" target="_blank">ici</a> pour télécharger notre app
                                </Typography>
                            )
                    }
                        </Grid>
                    </Grid>
                </div>
            );
        } else {
            return <div></div>
        }
    }
}

export default connect(mapStateToProps)(withStyles(styles)(MobileWarner));
