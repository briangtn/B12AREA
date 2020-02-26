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
}

interface Props {
    classes: {
        root: string,
        media: string
    },
    api_url: string,
    services: {name: string, description: string, icon: string, color: string}[]
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
    render() {
        const { classes, services } = this.props;

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
                                style={{backgroundColor: elem["color"]}}
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
