import { Component, Input, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MapboxJourneyMapComponent, MapClickEvent } from '../../../shared/mapbox-journey-map/mapbox-journey-map.component';

/**
 * PathlineMapComponent - Displays a journey map with markers and polylines.
 * 
 * This component uses Mapbox GL JS (via MapboxJourneyMapComponent) to display
 * an editable journey path. Users can:
 * - Click on the map to add new markers
 * - Right-click on markers to remove them
 * - Markers are connected by a dashed polyline
 * 
 * Migrated from Google Maps to Mapbox for better cost efficiency.
 */
@Component({
    selector: 'app-pathline-map',
    templateUrl: './pathline-map.component.html',
    styleUrls: ['./pathline-map.component.scss']
})
export class PathlineMapComponent {

    @ViewChild(MapboxJourneyMapComponent) mapComponent!: MapboxJourneyMapComponent;

    /** FormArray containing marker coordinates (each with 'latitude' and 'longitude' controls) */
    @Input() markersForm!: FormArray;

    /** Default center latitude (Ecuador) */
    readonly centerLat = -1.831239;

    /** Default center longitude (Ecuador) */
    readonly centerLng = -78.183406;

    /** Default zoom level */
    readonly defaultZoom = 7;

    /** Marker color */
    readonly markerColor = '#25265E';

    /** Polyline color */
    readonly polylineColor = '#25265E';

    constructor() {}

    /**
     * Handle map click event - adds a new marker at the clicked position
     */
    onMapClick(event: MapClickEvent): void {
        this.markersForm.push(new FormGroup({
            latitude: new FormControl(event.lat),
            longitude: new FormControl(event.lng),
        }));
        this.markersForm.markAsDirty();
    }

    /**
     * Handle marker right-click event - removes the marker at the given index
     */
    onMarkerRightClick(event: { index: number }): void {
        this.markersForm.removeAt(event.index);
        this.markersForm.markAsDirty();
    }
}
