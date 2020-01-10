import React, { Component } from 'react';

interface Props {}

interface State {}

class ClientAPK extends Component<Props, State> {
    componentDidMount(): void {
        fetch('apk/area.apk')
        .then(response => {
            response.blob().then(blob => {
                let url = window.URL.createObjectURL(blob);
                let downloadArea = document.createElement('a');

                downloadArea.href = url;
                downloadArea.download = 'area.apk';
                downloadArea.click();
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
