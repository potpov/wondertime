import React from 'react';
import PropTypes from 'prop-types';
import {map_style} from './map_style.js';

class Map extends React.Component {

    constructor(props) {
        super(props);
        this.mapRef = React.createRef();
    }

    componentDidMount(){
        let timeline_hash = this.props.timeline_hash;
        //loading coords and removing possible duplicates
        const coords = this.props.coords.filter(
            (coord, index, self) => self.findIndex(
                t => t.lat === coord.lat && t.lng === coord.lng
            ) === index
        );

        /* creating map */
        var map = new google.maps.Map(this.mapRef.current, {
            // using bounds instead of center and zoom!
            gestureHandling: 'none',
            zoomControl: false,
            disableDefaultUI: true,
            styles: map_style,  // custom vintage style
        });

        /* creating markers and bounds for zoom */
        var markers = [];
        let bounds = new google.maps.LatLngBounds();
        coords.forEach(function(coord, index) {
            bounds.extend(new google.maps.LatLng(coord.lat , coord.lng));
            let marker = new google.maps.Marker({
                position: coord,
                map: map,
                url: (timeline_hash + '#' + index)});
            google.maps.event.addListener(marker, 'click', function() {
                    window.location.href = this.url;
            });
            markers.push(marker);
        });
        map.fitBounds(bounds);

        /* creating routes */
        var path = new google.maps.Polyline({
            path: coords,
            geodesic: true,
            strokeColor: '#a01c1c',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        path.setMap(map);
    }

    render(){

        return(
            <div id="map_hash" ref={this.mapRef}> </div>
        );
    }
}

Map.propTypes = {
  map_hash: PropTypes.string
};

export default Map;

