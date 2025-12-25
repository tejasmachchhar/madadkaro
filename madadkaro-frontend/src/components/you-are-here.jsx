import { useEffect, useState, useRef } from "react";
import { middleOfIndia } from "../lib/constants";
import { Popup, useMap } from "@vis.gl/react-maplibre";
import { getLocation } from "../lib/api";
export default function YouAreHere({ onLocationFound }) {
    const [popupLocation, setPopupLocation] = useState(null);
    const { current: map } = useMap();
    const hasCalledCallback = useRef(false);
    const hasInitialized = useRef(false);
    
    useEffect(() => {
        if (!map || hasInitialized.current)
            return;
        hasInitialized.current = true;
        (async () => {
            const location = await getLocation();
            if (location !== middleOfIndia) {
                const locationObj = { lat: location[1], lng: location[0] };
                // Update the popup location
                setPopupLocation(location);
                // Fly to location with proper zoom first
                map.flyTo({ 
                    center: location, 
                    zoom: 13,
                    duration: 2000
                });
                // Update marker position after flyTo animation has started
                if (onLocationFound && !hasCalledCallback.current) {
                    hasCalledCallback.current = true;
                    // Small delay to let flyTo start, but update marker during animation
                    setTimeout(() => {
                        onLocationFound(locationObj);
                    }, 100);
                }
            }
        })();
    }, [map, onLocationFound]);
    if (!map || !popupLocation)
        return null;
    return (<Popup 
        longitude={popupLocation[0]} 
        latitude={popupLocation[1]} 
        anchor="bottom"
        closeButton={true}
        closeOnClick={false}>
      <div style={{ padding: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>You are approximately here!</h3>
      </div>
    </Popup>);
}
