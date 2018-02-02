/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {

    var L = window['L'];
    var d3 = window['d3'];

    "use strict";
    export class Visual implements IVisual {
        private dataView: DataView;
        private map: L.Map;
        private basemap: L.TileLayer;
        private markerLayer: L.LayerGroup<L.CircleMarker>;

        constructor(options: VisualConstructorOptions) {
            console.log('constructor called');

            let mapDiv = document.createElement('div');
            mapDiv.setAttribute('id', 'map');
            mapDiv.style.height = '720px';

            options.element.appendChild(mapDiv);

            var attribution ='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
            this.basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: attribution});

            this.map = L.map('map', {
                center: new L.LatLng(25, 0),
                zoom: 2
            });

            this.map.addLayer(this.basemap);
        }

        public static converter(dataView: DataView) {
            const {columns, rows} = dataView.table;
            const c10 = d3.scaleOrdinal(d3.schemeCategory10);

            const datas = rows.map(function (row, idx) {
                let data = row.reduce(function (d, v, i) {
                    const role = Object.keys(columns[i].roles)[0]
                    d[role] = v;
                    return d;
                }, {});
                
                data['color'] = c10(data['category']);

                return data;
            });

            return datas;
        }

        public update(options: VisualUpdateOptions) {
            console.log('update called');
            
            let mapEl = document.getElementById('map');
            const height = options.viewport.height + 'px';
            const width = options.viewport.width + 'px';
            mapEl.style.height = height;
            mapEl.style.width = width;

            this.map.invalidateSize(true);

            console.log(options.dataViews);

            if (!options.dataViews && !options.dataViews[0]) return;
        
            if (this.markerLayer) this.map.removeLayer(this.markerLayer);

            this.dataView = options.dataViews[0];
            const data = Visual.converter(this.dataView);

            const markers = data.map(function (d) {
                const latlng = L.latLng([d['latitude'], d['longitude']]);
                let marker = L.circleMarker(latlng, {color: d['color'], fillOpacity: 1});
                marker.setRadius(1);

                const category = d['category'] ? d['category'] : 'NA';
                marker.bindPopup(d['tooltip'] + ' : ' + category);
                marker.on('mouseover', function (evt) {
                    marker.openPopup();
                });
                
                return marker;
            });

            this.markerLayer = L.layerGroup(markers);
            this.map.addLayer(this.markerLayer);
        }

        public destroy() {
            console.log('destroy called');
            this.map.remove();
        }
    }
}