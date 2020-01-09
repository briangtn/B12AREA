import React, { Component } from 'react';

interface Props {}

interface State {}

class ClientAPK extends Component<Props, State> {
    componentDidMount(): void {
        fetch('/data/apk/area.apk')
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const downloadArea : HTMLAnchorElement = document.createElement('downloadArea') as HTMLAnchorElement;

                downloadArea.style.display = 'none';
                downloadArea.href = url;
                downloadArea.download = 'area.apk';

                document.body.appendChild(downloadArea);
                downloadArea.click();
                console.log('issou')

                window.URL.revokeObjectURL(url);
            })
            .catch(() => alert('download failed.'));
    }

    render() {
        return (
            <div>
            </div>
        );
    }
}

export default ClientAPK;
