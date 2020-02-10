import React, { Component } from 'react';
import "react-multi-carousel/lib/styles.css";

import { connect } from "react-redux";

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Carousel from "react-multi-carousel";

import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

interface State {
    services: {name: string, description: string, icon: string, color: string}[]
}

interface Props {
    classes: {
        root: string,
        media: string
    },
    api_url: string
}

const styles = (theme: Theme) => createStyles({
    root: {
        maxWidth: 345,
    },
    media: {
        height: 140,
    },
});

const responsive = {
    desktop: {
        breakpoint: {
            max: 3000,
            min: 1024
        },
        items: 3,
        partialVisibilityGutter: 40
    },
    mobile: {
        breakpoint: {
            max: 464,
            min: 0
        },
        items: 1,
        partialVisibilityGutter: 30
    },
    tablet: {
        breakpoint: {
            max: 1024,
            min: 464
        },
        items: 2,
        partialVisibilityGutter: 30
    }
};

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url };
};

class HomeCarousel extends Component<Props, State> {
    state: State = {
        services: []
    };

    componentDidMount(): void {
        const { api_url } = this.props;

        fetch(`${api_url}/about.json`)
            .then(res => res.json())
            .then(data => {
                const servicesArray = data['server']['services'];
                const tmp: {name: string, description: string, icon: string, color: string}[] = [];

                for (let service of servicesArray) {
                    const tmpObject: {name: string, description: string, icon: string, color: string} = {
                        name: service['name'],
                        description: service['description'],
                        icon: service['icon'],
                        color: service['string']
                    };
                    tmp.push(tmpObject);
                }
                this.setState({ services: tmp });
            });
    }

    render() {
        const { classes } = this.props;
        const { services } = this.state;

        return (
            <Carousel
                additionalTransfrom={0}
                arrows
                autoPlay
                autoPlaySpeed={1}
                centerMode={true}
                className=""
                containerClass="container-with-dots"
                customTransition="all 4s linear"
                dotListClass=""
                draggable
                focusOnSelect={false}
                infinite
                itemClass=""
                keyBoardControl
                minimumTouchDrag={80}
                renderButtonGroupOutside={false}
                renderDotsOutside={false}
                responsive={responsive}
                showDots={false}
                sliderClass=""
                slidesToSlide={2}
                swipeable
                transitionDuration={4000}
            >
                {services.map(elem => (
                    <Card className={classes.root} key={services.indexOf(elem)}>
                        <CardActionArea>
                            <CardMedia
                                className={classes.media}
                                image={elem["icon"]}
                                title="Contemplative Reptile"
                            />
                                <CardContent>
                                    <Typography gutterBottom variant="h5" component="h2">
                                        { elem["name"] }
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" component="p">
                                        { elem["description"] }
                                    </Typography>
                                </CardContent>
                        </CardActionArea>
                    </Card>
                ))}
            </Carousel>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(HomeCarousel));
