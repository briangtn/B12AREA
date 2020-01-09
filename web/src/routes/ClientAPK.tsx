import React, { Component } from 'react';

interface Props {}

interface State {}

class ClientAPK extends Component<Props, State> {
    componentDidMount(): void {
        fetch('apk/area.apk')
        .then(response => {
            response.blob().then(blob => {
                let url = window.URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.href = url;
                a.download = 'area.apk';
                a.click();
            });
        });
    }

    render() {
        return (
            <div>
                <a id="download" href="apk/area.apk" download="area.apk" />
            </div>
        );
    }
}

export default ClientAPK;
