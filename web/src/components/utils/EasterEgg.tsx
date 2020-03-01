import React, { Component } from 'react';

// @ts-ignore
import Sky from 'react-sky'

const sequence = [
    'j',
    'u',
    'l',
    'i',
    'a',
    'n',
    ' ',
    'b',
    'o',
    's',
    's',
    'e',
    ' ',
    'u',
    'n',
    ' ',
    'p',
    'e',
    'u',
    ' ',
    's',
    't',
    'p'
];

interface State {
    currentString: string,
    currentIndex: number,
    easterEgg: boolean
}

interface Props {

}

export default class EasterEgg extends Component<Props, State> {
    state: State = {
        currentString: '',
        currentIndex: 0,
        easterEgg: false
    };

    componentDidMount(): void {
        window.addEventListener('keydown', this.keyDown);
    }

    keyDown = (e: any) => {
        let { currentString, currentIndex } = this.state;

        if (sequence[currentIndex] === e.key) {
            currentString += e.key;
            currentIndex += 1;
        } else {
            currentString = '';
            currentIndex = 0;
        }
        if (currentString.length === sequence.length && !this.state.easterEgg)
            this.setState({ easterEgg: true });
        this.setState({ currentString: currentString, currentIndex: currentIndex });
    };

    render() {
        return (
            <div>
                { this.state.easterEgg ? (
                    <Sky
                        images={{
                            /* FORMAT AS FOLLOWS */
                            0: "https://avatars0.githubusercontent.com/u/33515078?s=460&v=4",
                            1: "https://avatars0.githubusercontent.com/u/6644033?s=400&v=4",
                            2: "https://media-exp1.licdn.com/dms/image/C4D03AQG7oj_1En43aA/profile-displayphoto-shrink_200_200/0?e=1586390400&v=beta&t=0JkBuXWTTwtSiNECJFWILUfyMkRwIjkpMEnEU041hdo",
                            3: "https://d2homsd77vx6d2.cloudfront.net/avatars/2018/02/12/julesbulteau.191841.191844.jpg",
                            4: "https://intra.epitech.eu/file/userprofil/charlie.jeanneau.bmp",
                            5: "https://intra.epitech.eu/file/userprofil/romain.fouyer.bmp"
                        }}
                        how={130}
                        time={40}
                    />
                ) : ''}
            </div>
        );
    }
}
