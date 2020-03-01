import { Component } from 'react';

import { connect } from 'react-redux';

import french from "../../translation/french.translation";
import english from "../../translation/english.translation";

interface Props {
    language: string,
    sentence: string
}

interface State {

}

const mapStateToProps = (state: any) => {
    return { language: state.language };
};

class Translator extends Component<Props, State> {
    render() {
        const { language, sentence } = this.props;

        return (language === 'fr') ? french[sentence as keyof typeof french] : english[sentence as keyof typeof english]
    }
}

export default connect(mapStateToProps)(Translator);
