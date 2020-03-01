import React, { Component } from 'react';

import { connect } from "react-redux";

import { withStyles, createStyles, Theme } from "@material-ui/core";

import { switchLanguage } from "../../actions/language.action";

import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import Cookies from "universal-cookie";

const cookies = new Cookies();

interface Props {
    language: string,
    classes: {
        formControl: string,
        selectEmpty: string,
        select: string,
        icon: string
    },
    switchLanguage: any
}

interface State {
    lang: string,
    equivalentValue: Array<string>,
}

function mapDispatchToProps(dispatch: any) {
    return { switchLanguage: (language: object) => dispatch(switchLanguage(language)) };
}

const mapStateToProps = (state: any) => {
    return { language: state.language };
};

const styles = (theme: Theme) => createStyles({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
        color: 'white'
    },
    icon: {
        fill: 'white'
    },
    select: {
        "&:before": {
            borderColor: 'white'
        },
        '&:after': {
            borderColor: 'white'
        },
        color: 'white'
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
});

class LanguagePicker extends Component<Props, State> {
    state: State = {
        lang: this.props.language,
        equivalentValue: ['fr', 'en'],
    };

    onChange = (e: React.ChangeEvent<{ value: unknown }>) => {
        e.preventDefault();

        const newValue : number = e.target.value as number;
        const { equivalentValue } = this.state;

        cookies.set('language', equivalentValue[newValue]);
        this.props.switchLanguage(equivalentValue[newValue]);
        this.setState({ lang: equivalentValue[newValue] });
    };

    render() {
        const { classes } = this.props;
        const { lang, equivalentValue } = this.state;

        return (
            <FormControl className={classes.formControl}>
                <Select
                    className={classes.select}
                    value={equivalentValue.indexOf(lang)}
                    onChange={this.onChange}
                    inputProps={{
                        classes: {
                            icon: classes.icon
                        }
                    }}
                >
                    <MenuItem value={0}><span role="img" aria-label="fr">🇫🇷</span>&nbsp;&nbsp;Français</MenuItem>
                    <MenuItem value={1}><span role="img" aria-label="en">🇺🇸</span>&nbsp;&nbsp;English</MenuItem>
                </Select>
            </FormControl>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(LanguagePicker));
